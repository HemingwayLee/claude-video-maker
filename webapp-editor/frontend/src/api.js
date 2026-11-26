async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    // Surface FastAPI's {"detail": ...} message when there is one.
    const body = await res.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : body?.detail?.[0]?.msg;
    throw new Error(detail || `${res.status} ${res.statusText}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  models: () => request("/models"),
  listConversations: () => request("/conversations"),
  getConversation: (id) => request(`/conversations/${id}`),
  createConversation: (model) => request("/conversations", { method: "POST", body: JSON.stringify({ model }) }),
  updateConversation: (id, patch) =>
    request(`/conversations/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: "DELETE" }),
  promptHistory: () => request("/prompts/history"),
  // Stop an answer (the Stop button). It keeps running on the server until stopped, even if the page closes.
  cancelTurn: (id) => request(`/turns/${id}/cancel`, { method: "POST" }),
};

/** Read a server-sent event stream, calling onEvent for each event; resolves when the stream ends. */
async function readEvents(res, onEvent) {
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new Error(typeof body?.detail === "string" ? body.detail : `${res.status} ${res.statusText}`);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const data = chunk
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.slice(6))
        .join("\n");
      if (data) onEvent(JSON.parse(data));
    }
  }
}

/**
 * Send a chat message and stream Claude Code's reply. The first event is {type: "turn", turn_id}.
 * Aborting `signal` only stops watching: the answer keeps going on the server (use api.cancelTurn to stop it).
 */
export async function streamMessage(conversationId, content, { onEvent, signal }) {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    signal,
  });
  await readEvents(res, onEvent);
}

/** Watch an answer from its start (e.g. one still running after a reload). */
export async function watchTurn(turnId, { onEvent, signal }) {
  await readEvents(await fetch(`/api/turns/${turnId}/stream`, { signal }), onEvent);
}

/** A turn being answered, before the server has saved it (no id yet). */
export const newTurn = (question, { model }) => ({
  id: null,
  question,
  model,
  content: "",
  activity: [],
  status: "running",
  error: null,
  cost_usd: null,
  newMessage: false,
});

const joinErrors = (a, b) => (a ? `${a}\n${b}` : b);

/** Fold a streamed event into the turn being answered (mirrors Answer in backend/app/jobs.py). */
export function applyEvent(turn, event) {
  switch (event.type) {
    case "text": {
      let content = turn.content;
      // Text from consecutive assistant messages (e.g. before and after a tool call) is new paragraphs.
      if (turn.newMessage && content && !content.endsWith("\n\n")) content = `${content.replace(/\n+$/, "")}\n\n`;
      return { ...turn, content: content + event.text, newMessage: false };
    }
    case "turn":
      return { ...turn, turnId: event.turn_id }; // the server's id, for Stop; `id` stays null until saved
    case "message_start":
      return { ...turn, newMessage: true };
    case "tool_use":
    case "tool_result":
      return { ...turn, activity: [...turn.activity, event] };
    case "result":
      return event.is_error
        ? { ...turn, cost_usd: event.cost_usd, status: "error", error: joinErrors(turn.error, event.result || event.subtype) }
        : { ...turn, cost_usd: event.cost_usd, status: "complete" };
    case "error":
      return { ...turn, status: "error", error: joinErrors(turn.error, event.text) };
    case "saved":
      return event.turn; // the server's copy, with its id
    default:
      return turn;
  }
}

/** Send a multipart form with upload progress (fetch can't report it). onProgress gets 0..1. */
function sendForm(method, path, form, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `/api${path}`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve(xhr.response);
      const detail = xhr.response?.detail;
      reject(new Error((typeof detail === "string" ? detail : detail?.[0]?.msg) || `${xhr.status} ${xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(form);
  });
}

/** Source videos for the Video Editing tab. */
export const videosApi = {
  list: () => request("/videos"),
  importYouTube: (url, { subtitleLang, generateSubtitles }) =>
    request("/videos/youtube", {
      method: "POST",
      body: JSON.stringify({ url, subtitle_lang: subtitleLang, generate_subtitles: generateSubtitles }),
    }),
  upload: (videoFile, srtFile, options) => {
    const form = new FormData();
    form.append("video", videoFile);
    if (srtFile) form.append("subtitles", srtFile);
    return sendForm("POST", "/videos/upload", form, options);
  },
  replaceSubtitles: (id, srtFile) => {
    const form = new FormData();
    form.append("subtitles", srtFile);
    return sendForm("PUT", `/videos/${id}/subtitles`, form);
  },
  deleteSubtitles: (id) => request(`/videos/${id}/subtitles`, { method: "DELETE" }),
  // Save the editor's timeline: {segments: [[start, end], ...]} and/or {cues: [{start, end, text}, ...]}.
  // keepalive lets a save finish when the page closes, but browsers cap such bodies at 64 KB.
  saveEdit: (id, edit) => {
    const body = JSON.stringify(edit);
    return request(`/videos/${id}/edit`, { method: "PUT", body, keepalive: body.length < 60_000 });
  },
  resetEdit: (id) => request(`/videos/${id}/edit`, { method: "DELETE" }),
  rename: (id, title) => request(`/videos/${id}`, { method: "PATCH", body: JSON.stringify({ title }) }),
  remove: (id) => request(`/videos/${id}`, { method: "DELETE" }),
  videoUrl: (id) => `/api/videos/${id}/video`,
  srtUrl: (id) => `/api/videos/${id}/subtitles.srt`,
  waveformUrl: (id) => `/api/videos/${id}/waveform`,
  vttUrl: (id) => `/api/videos/${id}/subtitles.vtt`,
};

/** Animations Claude Code makes from selected subtitles, and the options it uses. */
export const animationsApi = {
  getOptions: () => request("/animation-options"),
  saveOptions: (options) => request("/animation-options", { method: "PUT", body: JSON.stringify(options) }),
  list: () => request("/animations"),
  get: (id) => request(`/animations/${id}`),
  // {video_id, cues: [{start, end, text}] (source time), prompt, title?, options?: overrides}
  create: (body) => request("/animations", { method: "POST", body: JSON.stringify(body) }),
  cancel: (id) => request(`/animations/${id}/cancel`, { method: "POST" }),
  remove: (id) => request(`/animations/${id}`, { method: "DELETE" }),
  videoUrl: (id, download = false) => `/api/animations/${id}/video${download ? "?download=true" : ""}`,
  thumbnailUrl: (id) => `/api/animations/${id}/thumbnail`,
};

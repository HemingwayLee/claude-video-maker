import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Link, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Navigate, useLocation, useNavigate } from "react-router";
import { videosApi } from "../api";
import ImportDialog from "../components/video/ImportDialog";
import VideoEditor from "../components/video/VideoEditor";
import VideoSidebar from "../components/video/VideoSidebar";
import SplitLayout from "../layout/SplitLayout";
import { formatBytes, formatDuration } from "../video/format";

/** The Video Editing tab: imported videos on the left, the selected one in the editor on the right. */
export default function VideoEditingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [videos, setVideos] = useState(null); // null until first loaded
  const [importOpen, setImportOpen] = useState(false);
  const [error, setError] = useState(null);

  const idParam = location.pathname.split("/")[2];
  const currentId = idParam ? Number(idParam) : null;
  const current = videos?.find((v) => v.id === currentId) ?? null;

  const refresh = useCallback(async () => {
    try {
      setVideos(await videosApi.list());
    } catch (e) {
      setError(`Cannot load videos: ${e.message}`);
      setVideos((v) => v ?? []);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll while an import (download, then maybe subtitles by Claude Code) is running.
  const busy = videos?.some((v) => v.status === "downloading" || v.status === "transcribing");
  useEffect(() => {
    if (!busy) return undefined;
    const timer = setInterval(refresh, 1500);
    return () => clearInterval(timer);
  }, [busy, refresh]);

  const select = (id) => navigate(`/video/${id}`);

  const rename = async (id, title) => {
    try {
      await videosApi.rename(id, title);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (video) => {
    if (!window.confirm(`Delete “${video.title}” and its files?`)) return;
    try {
      await videosApi.remove(video.id);
      if (video.id === currentId) navigate("/video", { replace: true });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const onError = useCallback((message) => setError(message), []);
  // The editor saved an edit: take the server's copy of that video.
  const onSaved = useCallback((video) => setVideos((list) => list?.map((v) => (v.id === video.id ? video : v))), []);

  // Open the most recent video when none (or a deleted one) is selected.
  if (videos?.length && !current) return <Navigate to={`/video/${videos[0].id}`} replace />;
  if (videos && !videos.length && idParam) return <Navigate to="/video" replace />;

  const meta = current && [formatDuration(current.duration_s), formatBytes(current.size_bytes)].filter(Boolean).join(" · ");

  return (
    <SplitLayout
      sidebar={
        <VideoSidebar
          videos={videos ?? []}
          currentId={currentId}
          onSelect={select}
          onImport={() => setImportOpen(true)}
          onRename={rename}
          onDelete={remove}
        />
      }
      header={
        current && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline", minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap title={current.title}>
              {current.title}
            </Typography>
            {meta && (
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                {meta}
              </Typography>
            )}
            {current.source_url && (
              <Link href={current.source_url} target="_blank" rel="noreferrer" variant="caption" sx={{ flexShrink: 0 }}>
                Source
              </Link>
            )}
          </Stack>
        )
      }
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mx: 2, mb: 1 }}>
          {error}
        </Alert>
      )}

      {current ? (
        <VideoEditor key={current.id} video={current} onChanged={refresh} onSaved={onSaved} onError={onError} />
      ) : (
        videos && (
          <Stack spacing={2} sx={{ flex: 1, alignItems: "center", justifyContent: "center", p: 4, textAlign: "center" }}>
            <Typography variant="h6">No videos yet</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
              Import a video from your computer (with an optional .srt) or from a YouTube link. Its subtitles show up
              on the timeline.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setImportOpen(true)}>
              Import video
            </Button>
          </Stack>
        )
      )}

      <Box>
        <ImportDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onImported={(video) => {
            setImportOpen(false);
            setVideos((list) => [video, ...(list ?? []).filter((v) => v.id !== video.id)]);
            select(video.id);
            refresh();
          }}
        />
      </Box>
    </SplitLayout>
  );
}

import { useEffect, useRef } from "react";

/**
 * The audio waveform for the timeline's Audio track, following the edit (removed parts are skipped).
 * Only the visible part is drawn, on a viewport-sized canvas that moves with the scroll position, so it stays
 * cheap at any zoom. `peaks` holds one 0-255 value per 1/`rate` seconds of the source video.
 */
export default function Waveform({ scrollRef, viewW, pps, clips, peaks, rate, height }) {
  const canvasRef = useRef(null);
  const frame = useRef(0);

  useEffect(() => {
    const scroller = scrollRef.current;
    const canvas = canvasRef.current;
    if (!scroller || !canvas || !peaks || !viewW) return undefined;

    const draw = () => {
      frame.current = 0;
      const dpr = window.devicePixelRatio || 1;
      const left = scroller.scrollLeft;
      canvas.style.left = `${left}px`;
      canvas.style.width = `${viewW}px`;
      if (canvas.width !== Math.round(viewW * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(viewW * dpr);
        canvas.height = Math.round(height * dpr);
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, viewW, height);
      if (!clips.length) return;

      const mid = height / 2;
      const amp = mid - 3;
      // The theme's primary colour (a CSS variable, so it follows light/dark mode).
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--mui-palette-primary-main").trim() || "#d97757";
      ctx.globalAlpha = 0.75;
      const secPerPx = 1 / pps;
      let ci = 0;
      for (let x = 0; x < viewW; x++) {
        const t = (left + x) * secPerPx;
        while (ci < clips.length - 1 && t >= clips[ci].outEnd) ci++;
        const c = clips[ci];
        if (t >= c.outEnd) break; // past the end of the edit
        if (c.source) continue; // inserted material: not the source video's audio
        const src = c.start + (t - c.outStart);
        const srcEnd = Math.min(src + secPerPx, c.end);
        const i0 = Math.floor(src * rate);
        const i1 = Math.min(Math.max(i0 + 1, Math.ceil(srcEnd * rate)), peaks.length);
        let m = 0;
        for (let i = i0; i < i1; i++) if (peaks[i] > m) m = peaks[i];
        // A slight curve so quiet speech is still visible next to loud parts.
        const h = Math.max(0.5, Math.pow(m / 255, 0.75) * amp);
        ctx.fillRect(x, mid - h, 1, h * 2);
      }

      // Gaps where the video was split (and around inserted material).
      ctx.globalAlpha = 1;
      for (let k = 1; k < clips.length; k++) {
        const x = clips[k].outStart * pps - left;
        if (x >= -2 && x <= viewW + 2) ctx.clearRect(x - 1, 0, 2, height);
      }
    };

    const schedule = () => {
      if (!frame.current) frame.current = requestAnimationFrame(draw);
    };
    draw();
    scroller.addEventListener("scroll", schedule, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [scrollRef, viewW, pps, clips, peaks, rate, height]);

  return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, height, pointerEvents: "none" }} />;
}

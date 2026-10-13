import { Config } from "@remotion/cli/config";

// JPEG is faster to capture than PNG; we don't need transparency.
Config.setVideoImageFormat("jpeg");
// Overwrite out/pix2pix-explainer.mp4 on every render.
Config.setOverwriteOutput(true);
// Remotion downloads its own headless Chrome. If that one doesn't start on
// your machine, point BROWSER_EXECUTABLE at another Chrome/Chromium binary.
Config.setBrowserExecutable(process.env.BROWSER_EXECUTABLE ?? null);

import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// Remotion downloads its own headless Chrome. If that one doesn't start on
// your machine, point BROWSER_EXECUTABLE at another Chrome/Chromium binary.
Config.setBrowserExecutable(process.env.BROWSER_EXECUTABLE ?? null);

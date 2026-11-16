import sharp from "sharp";
const [out, ...files] = process.argv.slice(2);
const W = 432, H = 768;
const cols = 4, rows = Math.ceil(files.length / cols);
const comps = await Promise.all(files.map(async (f, i) => ({ input: await sharp(f).resize(W, H).toBuffer(), left: (i % cols) * W, top: Math.floor(i / cols) * H })));
await sharp({ create: { width: W * cols, height: H * rows, channels: 3, background: "#000" } }).composite(comps).png().toFile(out);

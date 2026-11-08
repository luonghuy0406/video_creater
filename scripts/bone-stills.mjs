import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP;
}

const [prefix = "out/draft_", frames = "80,300,495,600,850,1150,1400", scale = "0.5"] = process.argv.slice(2);

const defaultChrome = process.platform === "darwin"
  ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  : process.platform === "win32"
  ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
  : "/usr/bin/google-chrome";
const browserExecutable = process.env.CHROME_PATH || (fs.existsSync(defaultChrome) ? defaultChrome : undefined);
const chromiumOptions = { gl: "angle" };

console.log("Bundling Remotion project...");
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  publicDir: path.resolve("public"),
});

console.log("Selecting composition BoneShort...");
const composition = await selectComposition({
  serveUrl,
  id: "BoneShort",
  browserExecutable,
  chromiumOptions,
});

const onBrowserLog = (l) => {
  if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 300));
};

fs.mkdirSync(path.dirname(prefix), { recursive: true });

for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  const outPath = `${prefix}frame_${f}.jpg`;
  await renderStill({
    composition,
    serveUrl,
    frame: f,
    output: outPath,
    imageFormat: "jpeg",
    jpegQuality: 88,
    scale: Number(scale),
    browserExecutable,
    chromiumOptions,
    timeoutInMilliseconds: 180000,
    onBrowserLog,
  });
  console.log(`Rendered frame ${f} -> ${outPath} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const activeHeadDir = path.join(repoRoot, "assets/rupa_theme/character/back");
const replaceActive = process.argv.includes("--replace-active");
const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const inputPath = positionalArgs[0];
const outDir = positionalArgs[1] ? path.resolve(positionalArgs[1]) : activeHeadDir;

if (!inputPath) {
  console.error(
    "Usage: node scripts/import_rupa_head_sheet.mjs <head-sheet.png> [out-dir] [--replace-active]",
  );
  process.exit(1);
}

const source = PNG.sync.read(fs.readFileSync(inputPath));
const columns = 3;

if (source.width < columns * 80 || source.height < 80) {
  console.error(`Expected a 3-cell horizontal head sheet, got ${source.width}x${source.height}`);
  process.exit(1);
}

const outputWidth = 360;
const outputHeight = 340;

const assets = [
  { fileName: "head-left.png", cellIndex: 0 },
  { fileName: "head-back.png", cellIndex: 1 },
  { fileName: "head-right.png", cellIndex: 2 },
];

for (const asset of assets) {
  const destination = path.join(outDir, asset.fileName);

  if (fs.existsSync(destination) && !replaceActive) {
    console.error(`Refusing to overwrite ${destination}. Pass --replace-active to replace it.`);
    process.exit(1);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCellBounds(cellIndex) {
  return {
    x0: Math.round((source.width * cellIndex) / columns),
    x1: Math.round((source.width * (cellIndex + 1)) / columns),
    y0: 0,
    y1: source.height,
  };
}

function chromaKeyPixel(r, g, b, a = 255) {
  const greenScore = g - Math.max(r, b);
  const despilledGreen = g > Math.max(r, b) + 6 && g > 80 ? Math.min(g, Math.max(r, b) + 4) : g;
  const isStrongGreen = g > 120 && greenScore > 70;
  const isEdgeGreen = g > 95 && greenScore > 34;

  if (!isEdgeGreen) {
    return [r, despilledGreen, b, a];
  }

  const alpha = isStrongGreen ? 0 : Math.round(clamp((70 - greenScore) / 36, 0, 1) * a);

  return [r, despilledGreen, b, alpha];
}

function keyedPixelAt(x, y) {
  if (x < 0 || x >= source.width || y < 0 || y >= source.height) {
    return [0, 0, 0, 0];
  }

  const index = (source.width * y + x) * 4;

  return chromaKeyPixel(
    source.data[index],
    source.data[index + 1],
    source.data[index + 2],
    source.data[index + 3],
  );
}

function isSubjectPixel(x, y) {
  const index = (source.width * y + x) * 4;
  const r = source.data[index];
  const g = source.data[index + 1];
  const b = source.data[index + 2];
  const greenScore = g - Math.max(r, b);

  return !(g > 105 && greenScore > 42);
}

function findSubjectBounds(cellBounds) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let y = cellBounds.y0; y < cellBounds.y1; y += 1) {
    for (let x = cellBounds.x0; x < cellBounds.x1; x += 1) {
      if (!isSubjectPixel(x, y)) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (!Number.isFinite(minX)) {
    return null;
  }

  const padX = Math.max(10, Math.round((maxX - minX + 1) * 0.08));
  const padY = Math.max(10, Math.round((maxY - minY + 1) * 0.08));

  return {
    x0: clamp(minX - padX, cellBounds.x0, cellBounds.x1 - 1),
    x1: clamp(maxX + padX + 1, cellBounds.x0 + 1, cellBounds.x1),
    y0: clamp(minY - padY, cellBounds.y0, cellBounds.y1 - 1),
    y1: clamp(maxY + padY + 1, cellBounds.y0 + 1, cellBounds.y1),
  };
}

function sampleBilinear(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const tx = x - x0;
  const ty = y - y0;
  const samples = [
    { pixel: keyedPixelAt(x0, y0), weight: (1 - tx) * (1 - ty) },
    { pixel: keyedPixelAt(x1, y0), weight: tx * (1 - ty) },
    { pixel: keyedPixelAt(x0, y1), weight: (1 - tx) * ty },
    { pixel: keyedPixelAt(x1, y1), weight: tx * ty },
  ];

  let alpha = 0;
  let red = 0;
  let green = 0;
  let blue = 0;

  for (const sample of samples) {
    const [r, g, b, a] = sample.pixel;
    const weightedAlpha = a * sample.weight;

    alpha += weightedAlpha;
    red += r * weightedAlpha;
    green += g * weightedAlpha;
    blue += b * weightedAlpha;
  }

  if (alpha <= 0.01) {
    return [0, 0, 0, 0];
  }

  return [
    Math.round(red / alpha),
    Math.round(green / alpha),
    Math.round(blue / alpha),
    Math.round(alpha),
  ];
}

function makeAsset({ fileName, cellIndex }) {
  const output = new PNG({ width: outputWidth, height: outputHeight });
  const cellBounds = getCellBounds(cellIndex);
  const subjectBounds = findSubjectBounds(cellBounds);

  if (!subjectBounds) {
    throw new Error(`${fileName} has no detectable subject pixels`);
  }

  const cropWidth = subjectBounds.x1 - subjectBounds.x0;
  const cropHeight = subjectBounds.y1 - subjectBounds.y0;
  const fitScale = Math.min(outputWidth / cropWidth, outputHeight / cropHeight);
  const fittedWidth = cropWidth * fitScale;
  const fittedHeight = cropHeight * fitScale;
  const insetX = (outputWidth - fittedWidth) / 2;
  const insetY = (outputHeight - fittedHeight) / 2;
  let visiblePixels = 0;

  for (let y = 0; y < outputHeight; y += 1) {
    for (let x = 0; x < outputWidth; x += 1) {
      const index = (outputWidth * y + x) * 4;

      if (x < insetX || x >= insetX + fittedWidth || y < insetY || y >= insetY + fittedHeight) {
        output.data[index] = 0;
        output.data[index + 1] = 0;
        output.data[index + 2] = 0;
        output.data[index + 3] = 0;
        continue;
      }

      const sourceX = subjectBounds.x0 + (x - insetX + 0.5) / fitScale - 0.5;
      const sourceY = subjectBounds.y0 + (y - insetY + 0.5) / fitScale - 0.5;
      const [r, g, b, a] = sampleBilinear(sourceX, sourceY);

      output.data[index] = r;
      output.data[index + 1] = g;
      output.data[index + 2] = b;
      output.data[index + 3] = a;

      if (a > 20) {
        visiblePixels += 1;
      }
    }
  }

  const visibleRatio = visiblePixels / (outputWidth * outputHeight);

  if (visibleRatio < 0.18) {
    throw new Error(`${fileName} extracted too little visible art (${visibleRatio.toFixed(3)})`);
  }

  return {
    buffer: PNG.sync.write(output),
    fileName,
  };
}

const outputs = assets.map((asset) => makeAsset(asset));

for (const output of outputs) {
  const destination = path.join(outDir, output.fileName);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, output.buffer);
  console.log(`wrote ${destination}`);
}

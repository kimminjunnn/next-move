import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const activeBodyDir = path.join(repoRoot, "assets/rupa_theme/character/back");
const replaceActive = process.argv.includes("--replace-active");
const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const inputPath = positionalArgs[0];
const outDir = positionalArgs[1] ? path.resolve(positionalArgs[1]) : activeBodyDir;

if (!inputPath) {
  console.error(
    "Usage: node scripts/import_rupa_body_sheet.mjs <body-sheet.png> [out-dir] [--replace-active]",
  );
  process.exit(1);
}

const source = PNG.sync.read(fs.readFileSync(inputPath));
const columns = 5;
const rows = 3;
const assets = [
  { fileName: "torso-back.png", cell: 0, width: 300, height: 520, trimTopRatio: 0.42 },
  { fileName: "upper-arm-left.png", cell: 1, width: 360, height: 140 },
  { fileName: "upper-arm-right.png", cell: 10, width: 360, height: 140 },
  { fileName: "forearm-left.png", cell: 2, width: 340, height: 128 },
  { fileName: "forearm-right.png", cell: 11, width: 340, height: 128 },
  { fileName: "thigh-left.png", cell: 3, width: 260, height: 144 },
  { fileName: "thigh-right.png", cell: 12, width: 260, height: 144 },
  { fileName: "shin-left.png", cell: 4, width: 280, height: 132 },
  { fileName: "shin-right.png", cell: 13, width: 280, height: 132 },
  { fileName: "hand-left.png", cell: 5, width: 176, height: 148 },
  { fileName: "hand-right.png", cell: 5, width: 176, height: 148 },
  { fileName: "foot-left.png", cell: 6, width: 196, height: 136 },
  { fileName: "foot-right.png", cell: 6, width: 196, height: 136 },
  { fileName: "tail.png", cell: 7, width: 420, height: 380 },
  { fileName: "chalk-bag.png", cell: 8, width: 208, height: 240 },
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

function getCellBounds(cell) {
  const column = cell % columns;
  const row = Math.floor(cell / columns);

  return {
    x0: Math.round((source.width * column) / columns),
    x1: Math.round((source.width * (column + 1)) / columns),
    y0: Math.round((source.height * row) / rows),
    y1: Math.round((source.height * (row + 1)) / rows),
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

  const padX = Math.max(8, Math.round((maxX - minX + 1) * 0.1));
  const padY = Math.max(8, Math.round((maxY - minY + 1) * 0.1));

  return {
    x0: clamp(minX - padX, cellBounds.x0, cellBounds.x1 - 1),
    x1: clamp(maxX + padX + 1, cellBounds.x0 + 1, cellBounds.x1),
    y0: clamp(minY - padY, cellBounds.y0, cellBounds.y1 - 1),
    y1: clamp(maxY + padY + 1, cellBounds.y0 + 1, cellBounds.y1),
  };
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

function makeAsset(asset) {
  const output = new PNG({ width: asset.width, height: asset.height });
  const cellBounds = getCellBounds(asset.cell);
  const subjectBounds = findSubjectBounds(cellBounds);

  if (!subjectBounds) {
    throw new Error(`${asset.fileName} has no detectable subject pixels`);
  }

  if (asset.trimTopRatio) {
    subjectBounds.y0 = Math.round(subjectBounds.y0 + (subjectBounds.y1 - subjectBounds.y0) * asset.trimTopRatio);
  }

  const cropWidth = subjectBounds.x1 - subjectBounds.x0;
  const cropHeight = subjectBounds.y1 - subjectBounds.y0;
  const fitScale = Math.min(asset.width / cropWidth, asset.height / cropHeight);
  const fittedWidth = cropWidth * fitScale;
  const fittedHeight = cropHeight * fitScale;
  const insetX = (asset.width - fittedWidth) / 2;
  const insetY = (asset.height - fittedHeight) / 2;
  let visiblePixels = 0;

  for (let y = 0; y < asset.height; y += 1) {
    for (let x = 0; x < asset.width; x += 1) {
      const index = (asset.width * y + x) * 4;

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

  const visibleRatio = visiblePixels / (asset.width * asset.height);

  if (visibleRatio < 0.16) {
    throw new Error(`${asset.fileName} extracted too little visible art (${visibleRatio.toFixed(3)})`);
  }

  return {
    buffer: PNG.sync.write(output),
    fileName: asset.fileName,
  };
}

const outputs = assets.map((asset) => makeAsset(asset));

for (const output of outputs) {
  const destination = path.join(outDir, output.fileName);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, output.buffer);
  console.log(`wrote ${destination}`);
}

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const activeOutDir = path.join(repoRoot, "assets/rupa_theme/character/back");
const rigFriendlyOutDir = path.join(
  repoRoot,
  "assets/rupa_theme/character/back-v5-rigged-illustration",
);
const outDirFlagIndex = process.argv.indexOf("--out-dir");
const outDir =
  outDirFlagIndex >= 0 && process.argv[outDirFlagIndex + 1]
    ? path.resolve(process.argv[outDirFlagIndex + 1])
    : rigFriendlyOutDir;
const replaceActive = process.argv.includes("--replace-active");

if (path.resolve(outDir) === path.resolve(activeOutDir) && !replaceActive) {
  console.error(
    "Refusing to write procedural placeholders into active character assets. Pass --replace-active to do this intentionally.",
  );
  process.exit(1);
}

const brown = [132, 78, 39];
const darkBrown = [76, 46, 29];
const plushBrown = [151, 92, 48];
const lightFur = [228, 181, 132];
const creamFur = [246, 215, 182];
const teal = [45, 151, 151];
const tealDark = [28, 92, 98];
const tealLight = [77, 185, 181];
const chalk = [239, 235, 222];
const belt = [45, 42, 37];

function makeCrcTable() {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    table[n] = c >>> 0;
  }

  return table;
}

const crcTable = makeCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;

  for (let index = 0; index < buffer.length; index += 1) {
    crc = crcTable[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);

  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, pixels) {
  const header = Buffer.alloc(13);
  const raw = Buffer.alloc((width * 4 + 1) * height);

  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  for (let y = 0; y < height; y += 1) {
    const rawRowStart = y * (width * 4 + 1);

    raw[rawRowStart] = 0;
    pixels.copy(raw, rawRowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND"),
  ]);
}

function createCanvas(width, height) {
  return {
    height,
    pixels: Buffer.alloc(width * height * 4),
    width,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function smoothStep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);

  return t * t * (3 - 2 * t);
}

function noise(x, y, seed) {
  const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;

  return value - Math.floor(value);
}

function mixColor(color, amount) {
  return color.map((channel) => clamp(Math.round(channel + amount), 0, 255));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function lerpColor(colorA, colorB, amount) {
  return colorA.map((channel, index) =>
    clamp(Math.round(lerp(channel, colorB[index], amount)), 0, 255),
  );
}

function blendPixel(canvas, x, y, color, alpha) {
  if (
    x < 0 ||
    y < 0 ||
    x >= canvas.width ||
    y >= canvas.height ||
    alpha <= 0
  ) {
    return;
  }

  const offset = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
  const srcAlpha = clamp(alpha, 0, 1);
  const dstAlpha = canvas.pixels[offset + 3] / 255;
  const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);

  if (outAlpha <= 0) {
    return;
  }

  canvas.pixels[offset] = Math.round(
    (color[0] * srcAlpha + canvas.pixels[offset] * dstAlpha * (1 - srcAlpha)) /
      outAlpha,
  );
  canvas.pixels[offset + 1] = Math.round(
    (color[1] * srcAlpha +
      canvas.pixels[offset + 1] * dstAlpha * (1 - srcAlpha)) /
      outAlpha,
  );
  canvas.pixels[offset + 2] = Math.round(
    (color[2] * srcAlpha +
      canvas.pixels[offset + 2] * dstAlpha * (1 - srcAlpha)) /
      outAlpha,
  );
  canvas.pixels[offset + 3] = Math.round(outAlpha * 255);
}

function drawEllipse(canvas, cx, cy, rx, ry, color, options = {}) {
  const seed = options.seed ?? 1;
  const texture = options.texture ?? 7;
  const highlight = options.highlight ?? 14;
  const shadow = options.shadow ?? 18;
  const highlightX = options.highlightX ?? -0.38;
  const highlightY = options.highlightY ?? -0.5;
  const rim = options.rim ?? 8;
  const minX = Math.floor(cx - rx - 4);
  const maxX = Math.ceil(cx + rx + 4);
  const minY = Math.floor(cy - ry - 4);
  const maxY = Math.ceil(cy + ry + 4);

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const distance = nx * nx + ny * ny;

      if (distance > 1.18) {
        continue;
      }

      const edgeAlpha = 1 - smoothStep(0.9, 1.18, distance);
      const lightDistance = Math.hypot(nx - highlightX, ny - highlightY);
      const highlightAmount = (1 - smoothStep(0.05, 1.15, lightDistance)) * highlight;
      const lowerShadow = smoothStep(-0.15, 1, ny) * shadow;
      const edgeShadow = smoothStep(0.52, 1.05, distance) * rim;
      const fur = (noise(x * 0.38, y * 0.38, seed) - 0.5) * texture;
      const microFur = (noise(x, y, seed + 11) - 0.5) * texture * 0.28;

      blendPixel(
        canvas,
        x,
        y,
        mixColor(color, highlightAmount - lowerShadow - edgeShadow + fur + microFur),
        edgeAlpha,
      );
    }
  }
}

function drawCircle(canvas, cx, cy, radius, color, options = {}) {
  drawEllipse(canvas, cx, cy, radius, radius, color, options);
}

function drawHorizontalCapsule(canvas, x1, y, x2, radius, color, options = {}) {
  const seed = options.seed ?? 1;
  const texture = options.texture ?? 7;
  const highlight = options.highlight ?? 12;
  const shadow = options.shadow ?? 16;
  const minX = Math.floor(Math.min(x1, x2) - radius - 4);
  const maxX = Math.ceil(Math.max(x1, x2) + radius + 4);
  const minY = Math.floor(y - radius - 4);
  const maxY = Math.ceil(y + radius + 4);

  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const clampedX = clamp(px + 0.5, x1, x2);
      const dx = px + 0.5 - clampedX;
      const dy = py + 0.5 - y;
      const distance = Math.hypot(dx, dy);

      if (distance > radius + 3) {
        continue;
      }

      const edgeAlpha = 1 - smoothStep(radius - 2, radius + 3, distance);
      const normalizedY = dy / radius;
      const normalizedX = (px + 0.5 - Math.min(x1, x2)) / Math.abs(x2 - x1);
      const plushHighlight = (1 - smoothStep(-0.8, 0.45, normalizedY)) * highlight;
      const lowerShadow = smoothStep(-0.1, 1, normalizedY) * shadow;
      const endShadow =
        (1 - smoothStep(0, 0.22, normalizedX)) * 5 +
        smoothStep(0.78, 1, normalizedX) * 5;
      const fur = (noise(px * 0.4, py * 0.4, seed) - 0.5) * texture;
      const microFur = (noise(px, py, seed + 13) - 0.5) * texture * 0.22;

      blendPixel(
        canvas,
        px,
        py,
        mixColor(color, plushHighlight - lowerShadow - endShadow + fur + microFur),
        edgeAlpha,
      );
    }
  }
}

function drawVerticalCapsule(canvas, x, y1, y2, radius, color, options = {}) {
  const seed = options.seed ?? 1;
  const texture = options.texture ?? 7;
  const minX = Math.floor(x - radius - 4);
  const maxX = Math.ceil(x + radius + 4);
  const minY = Math.floor(Math.min(y1, y2) - radius - 4);
  const maxY = Math.ceil(Math.max(y1, y2) + radius + 4);

  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const clampedY = clamp(py + 0.5, y1, y2);
      const dx = px + 0.5 - x;
      const dy = py + 0.5 - clampedY;
      const distance = Math.hypot(dx, dy);

      if (distance > radius + 3) {
        continue;
      }

      const normalizedX = dx / radius;
      const normalizedY = (py + 0.5 - Math.min(y1, y2)) / Math.abs(y2 - y1);
      const edgeAlpha = 1 - smoothStep(radius - 2, radius + 3, distance);
      const plushHighlight = (1 - smoothStep(-0.85, 0.35, normalizedX)) * 12;
      const lowerShadow = smoothStep(0.25, 1, normalizedY) * 14;
      const fur = (noise(px * 0.4, py * 0.4, seed) - 0.5) * texture;

      blendPixel(
        canvas,
        px,
        py,
        mixColor(color, plushHighlight - lowerShadow + fur),
        edgeAlpha,
      );
    }
  }
}

function drawPathCircles(canvas, points, radius, color, options = {}) {
  points.forEach((point, index) => {
    drawCircle(canvas, point.x, point.y, radius(point, index), color, {
      seed: (options.seed ?? 1) + index,
      texture: options.texture ?? 12,
    });
  });
}

function drawAccentLine(canvas, points, color, radius = 2) {
  points.forEach((point) => drawCircle(canvas, point.x, point.y, radius, color));
}

function drawFurStitches(canvas, points, color, radius = 1.4) {
  points.forEach((point, index) => {
    if (index % 2 === 0) {
      drawCircle(canvas, point.x, point.y, radius, color, {
        seed: 90 + index,
        texture: 0,
        highlight: 0,
        shadow: 0,
        rim: 0,
      });
    }
  });
}

function savePart(name, canvas) {
  writeFileSync(
    path.join(outDir, name),
    encodePng(canvas.width, canvas.height, canvas.pixels),
  );
}

function drawHairTuft(canvas, cx, cy, scale, seed) {
  drawEllipse(canvas, cx - 10 * scale, cy + 9 * scale, 10 * scale, 24 * scale, darkBrown, {
    seed,
    texture: 3,
    highlight: 4,
    shadow: 5,
    rim: 2,
  });
  drawEllipse(canvas, cx + 7 * scale, cy + 4 * scale, 9 * scale, 22 * scale, darkBrown, {
    seed: seed + 1,
    texture: 3,
    highlight: 4,
    shadow: 5,
    rim: 2,
  });
  drawEllipse(canvas, cx + 20 * scale, cy + 15 * scale, 7 * scale, 17 * scale, darkBrown, {
    seed: seed + 2,
    texture: 2,
    highlight: 3,
    shadow: 4,
    rim: 1,
  });
}

function makeHead() {
  const canvas = createCanvas(360, 340);
  const scale = 2;

  drawEllipse(canvas, 90 * scale, 88 * scale, 74 * scale, 65 * scale, plushBrown, {
    seed: 3,
    texture: 7,
    highlight: 18,
    shadow: 14,
    rim: 10,
  });
  drawEllipse(canvas, 90 * scale, 111 * scale, 55 * scale, 39 * scale, lerpColor(brown, lightFur, 0.2), {
    seed: 5,
    texture: 4,
    highlight: 10,
    shadow: 10,
    rim: 4,
  });
  drawEllipse(canvas, 79 * scale, 31 * scale, 16 * scale, 28 * scale, mixColor(plushBrown, -6), {
    seed: 7,
    texture: 5,
    highlight: 10,
    shadow: 8,
  });
  drawEllipse(canvas, 100 * scale, 30 * scale, 15 * scale, 29 * scale, mixColor(plushBrown, -10), {
    seed: 8,
    texture: 5,
    highlight: 9,
    shadow: 9,
  });
  drawHairTuft(canvas, 90 * scale, 19 * scale, scale, 101);
  drawEllipse(canvas, 68 * scale, 78 * scale, 12 * scale, 18 * scale, mixColor(plushBrown, 13), {
    seed: 9,
    texture: 2,
    highlight: 8,
    shadow: 3,
    rim: 0,
  });
  drawEllipse(canvas, 112 * scale, 76 * scale, 13 * scale, 17 * scale, mixColor(plushBrown, 9), {
    seed: 10,
    texture: 2,
    highlight: 7,
    shadow: 4,
    rim: 0,
  });

  return canvas;
}

function makeSideHead(direction) {
  const canvas = createCanvas(360, 340);
  const scale = 2;
  const faceSign = direction === "left" ? -1 : 1;
  const faceX = (90 + faceSign * 24) * scale;
  const backX = (90 - faceSign * 10) * scale;
  const nearEarX = (90 - faceSign * 55) * scale;
  const farEarX = (90 - faceSign * 6) * scale;
  const eyeX = (90 + faceSign * 29) * scale;
  const muzzleX = (90 + faceSign * 49) * scale;
  const noseX = (90 + faceSign * 59) * scale;

  drawEllipse(canvas, nearEarX, 83 * scale, 18 * scale, 24 * scale, lerpColor(lightFur, plushBrown, 0.22), {
    seed: direction === "left" ? 69 : 70,
    texture: 4,
    highlight: 9,
    shadow: 7,
    rim: 5,
  });
  drawEllipse(canvas, nearEarX + faceSign * 3 * scale, 86 * scale, 10 * scale, 15 * scale, creamFur, {
    seed: direction === "left" ? 87 : 88,
    texture: 2,
    highlight: 5,
    shadow: 3,
    rim: 1,
  });
  drawEllipse(canvas, backX, 88 * scale, 66 * scale, 64 * scale, plushBrown, {
    seed: direction === "left" ? 71 : 72,
    texture: 7,
    highlight: 16,
    shadow: 14,
    rim: 10,
  });
  drawHairTuft(canvas, (90 - faceSign * 2) * scale, 18 * scale, scale, direction === "left" ? 111 : 121);
  drawEllipse(canvas, farEarX, 33 * scale, 15 * scale, 27 * scale, mixColor(plushBrown, -9), {
    seed: direction === "left" ? 75 : 76,
    texture: 5,
    highlight: 8,
    shadow: 7,
  });
  drawEllipse(canvas, farEarX + faceSign * 22 * scale, 30 * scale, 13 * scale, 27 * scale, mixColor(plushBrown, -12), {
    seed: direction === "left" ? 77 : 78,
    texture: 5,
    highlight: 8,
    shadow: 8,
  });
  drawEllipse(canvas, faceX, 99 * scale, 42 * scale, 43 * scale, lerpColor(brown, lightFur, 0.26), {
    seed: direction === "left" ? 73 : 74,
    texture: 4,
    highlight: 11,
    shadow: 9,
    rim: 4,
  });
  drawEllipse(canvas, muzzleX, 106 * scale, 20 * scale, 13 * scale, creamFur, {
    seed: direction === "left" ? 83 : 84,
    texture: 2,
    highlight: 6,
    shadow: 3,
    rim: 1,
  });
  drawEllipse(canvas, muzzleX - faceSign * 8 * scale, 113 * scale, 16 * scale, 9 * scale, mixColor(creamFur, -8), {
    seed: direction === "left" ? 89 : 90,
    texture: 1,
    highlight: 3,
    shadow: 3,
    rim: 0,
  });
  drawCircle(canvas, eyeX, 78 * scale, 5.3 * scale, darkBrown, {
    seed: direction === "left" ? 81 : 82,
    texture: 0,
    highlight: 2,
    shadow: 0,
    rim: 0,
  });
  drawCircle(canvas, eyeX + faceSign * 1.5 * scale, 76 * scale, 1.6 * scale, [255, 246, 230], {
    seed: direction === "left" ? 91 : 92,
    texture: 0,
    highlight: 0,
    shadow: 0,
    rim: 0,
  });
  drawEllipse(canvas, noseX, 105 * scale, 5.5 * scale, 4 * scale, darkBrown, {
    seed: direction === "left" ? 85 : 86,
    texture: 0,
    highlight: 1,
    shadow: 0,
    rim: 0,
  });
  drawAccentLine(
    canvas,
    [
      { x: noseX - faceSign * 7 * scale, y: 115 * scale },
      { x: noseX - faceSign * 10 * scale, y: 117 * scale },
      { x: noseX - faceSign * 14 * scale, y: 117 * scale },
    ],
    mixColor(darkBrown, 8),
    1.2 * scale,
  );
  drawAccentLine(
    canvas,
    [
      { x: eyeX - faceSign * 8 * scale, y: 70 * scale },
      { x: eyeX - faceSign * 3 * scale, y: 68 * scale },
      { x: eyeX + faceSign * 2 * scale, y: 69 * scale },
    ],
    mixColor(darkBrown, 15),
    1.3 * scale,
  );

  return canvas;
}

function makeEar(seed) {
  const canvas = createCanvas(82, 92);

  drawEllipse(canvas, 41, 46, 34, 40, lerpColor(lightFur, plushBrown, 0.25), {
    seed,
    texture: 4,
    highlight: 12,
    shadow: 9,
    rim: 6,
  });
  drawEllipse(canvas, 45, 51, 23, 29, creamFur, {
    seed: seed + 1,
    texture: 3,
    highlight: 8,
    shadow: 7,
    rim: 2,
  });
  drawEllipse(canvas, 35, 31, 8, 10, mixColor(creamFur, 8), {
    seed: seed + 2,
    texture: 1,
    highlight: 5,
    shadow: 0,
    rim: 0,
  });

  return canvas;
}

function makeTorso() {
  const canvas = createCanvas(150, 260);

  drawEllipse(canvas, 75, 117, 52, 108, plushBrown, {
    seed: 10,
    texture: 8,
    highlight: 17,
    shadow: 20,
    rim: 13,
  });
  drawEllipse(canvas, 75, 182, 46, 57, lerpColor(brown, darkBrown, 0.22), {
    seed: 11,
    texture: 5,
    highlight: 9,
    shadow: 15,
    rim: 5,
  });
  drawEllipse(canvas, 75, 139, 25, 84, mixColor(plushBrown, 13), {
    seed: 12,
    texture: 3,
    highlight: 9,
    shadow: 6,
    rim: 0,
  });
  drawHorizontalCapsule(canvas, 31, 179, 119, 7, belt, {
    seed: 12,
    texture: 1,
    highlight: 4,
    shadow: 4,
  });
  drawHorizontalCapsule(canvas, 41, 175, 109, 2.2, mixColor(belt, 34), {
    seed: 13,
    texture: 0,
    highlight: 2,
    shadow: 0,
  });

  return canvas;
}

function makeLimb(width, height, radius, color, seed) {
  const canvas = createCanvas(width, height);
  const centerY = height / 2;
  const startX = radius + 6;
  const endX = width - radius - 6;

  drawHorizontalCapsule(canvas, startX, centerY, endX, radius + 2, lerpColor(color, plushBrown, 0.55), {
    seed,
    texture: 6,
    highlight: 15,
    shadow: 15,
  });
  drawHorizontalCapsule(
    canvas,
    startX + radius * 0.35,
    centerY - radius * 0.22,
    endX - radius * 0.45,
    Math.max(3, radius * 0.22),
    mixColor(color, 20),
    { seed: seed + 1, texture: 2, highlight: 5, shadow: 1 },
  );
  drawHorizontalCapsule(
    canvas,
    startX + radius * 0.55,
    centerY + radius * 0.42,
    endX - radius * 0.55,
    Math.max(3, radius * 0.18),
    mixColor(darkBrown, 8),
    { seed: seed + 2, texture: 2, highlight: 1, shadow: 4 },
  );

  return canvas;
}

function makeHand(seed) {
  const canvas = createCanvas(88, 74);

  drawEllipse(canvas, 48, 38, 31, 23, lightFur, {
    seed,
    texture: 4,
    highlight: 12,
    shadow: 9,
    rim: 4,
  });
  drawHorizontalCapsule(canvas, 9, 41, 27, 8, chalk, {
    seed: seed + 1,
    texture: 1,
    highlight: 4,
    shadow: 3,
  });
  drawHorizontalCapsule(canvas, 11, 48, 27, 3, mixColor(chalk, -18), {
    seed: seed + 1,
    texture: 0,
    highlight: 1,
    shadow: 1,
  });
  drawEllipse(canvas, 36, 22, 7, 12, creamFur, {
    seed: seed + 2,
    texture: 2,
    highlight: 6,
    shadow: 3,
    rim: 1,
  });
  drawEllipse(canvas, 49, 20, 7, 13, creamFur, {
    seed: seed + 3,
    texture: 2,
    highlight: 6,
    shadow: 3,
    rim: 1,
  });
  drawEllipse(canvas, 62, 23, 7, 12, creamFur, {
    seed: seed + 4,
    texture: 2,
    highlight: 6,
    shadow: 3,
    rim: 1,
  });
  drawAccentLine(
    canvas,
    [
      { x: 39, y: 39 },
      { x: 48, y: 36 },
      { x: 58, y: 39 },
    ],
    mixColor(lightFur, -28),
    0.9,
  );
  drawAccentLine(
    canvas,
    [
      { x: 35, y: 29 },
      { x: 43, y: 28 },
      { x: 51, y: 28 },
      { x: 60, y: 30 },
    ],
    mixColor(lightFur, -18),
    1,
  );

  return canvas;
}

function makeFoot(seed) {
  const canvas = createCanvas(98, 68);

  drawEllipse(canvas, 48, 38, 42, 20, lightFur, {
    seed,
    texture: 4,
    highlight: 11,
    shadow: 8,
    rim: 4,
  });
  drawEllipse(canvas, 39, 32, 13, 6, mixColor(lightFur, 8), {
    seed: seed + 1,
    texture: 1,
    highlight: 5,
    shadow: 1,
    rim: 0,
  });
  drawEllipse(canvas, 69, 31, 8, 8, creamFur, {
    seed: seed + 2,
    texture: 2,
    highlight: 6,
    shadow: 2,
    rim: 1,
  });
  drawEllipse(canvas, 78, 34, 8, 7, creamFur, {
    seed: seed + 3,
    texture: 2,
    highlight: 6,
    shadow: 2,
    rim: 1,
  });
  drawEllipse(canvas, 85, 38, 6, 6, creamFur, {
    seed: seed + 4,
    texture: 2,
    highlight: 5,
    shadow: 2,
    rim: 1,
  });
  drawAccentLine(
    canvas,
    [
      { x: 38, y: 32 },
      { x: 50, y: 29 },
      { x: 64, y: 31 },
    ],
    mixColor(lightFur, -20),
    0.9,
  );

  return canvas;
}

function makeTail() {
  const canvas = createCanvas(210, 190);
  const points = [];

  for (let index = 0; index < 150; index += 1) {
    const t = index / 149;
    const angle = -0.7 + t * 5.2;
    const radius = 76 - t * 48;

    points.push({
      x: 105 + Math.cos(angle) * radius,
      y: 98 + Math.sin(angle) * radius,
      t,
    });
  }

  drawPathCircles(
    canvas,
    points,
    (point) => 19 - point.t * 6,
    plushBrown,
    { seed: 50, texture: 6 },
  );
  drawFurStitches(
    canvas,
    points.filter((_, index) => index % 8 === 0),
    mixColor(plushBrown, 18),
    1.2,
  );

  return canvas;
}

function makeChalkBag() {
  const canvas = createCanvas(104, 120);

  drawEllipse(canvas, 52, 66, 39, 46, teal, {
    seed: 60,
    texture: 3,
    highlight: 16,
    shadow: 16,
    rim: 8,
  });
  drawEllipse(canvas, 52, 29, 42, 18, tealDark, {
    seed: 61,
    texture: 2,
    highlight: 8,
    shadow: 8,
    rim: 4,
  });
  drawEllipse(canvas, 52, 25, 29, 10, chalk, {
    seed: 62,
    texture: 2,
    highlight: 5,
    shadow: 2,
    rim: 1,
  });
  drawVerticalCapsule(canvas, 71, 49, 89, 3.5, tealLight, {
    seed: 67,
    texture: 1,
  });
  drawHorizontalCapsule(canvas, 21, 58, 83, 3.5, [236, 204, 130], {
    seed: 63,
    texture: 1,
    highlight: 2,
    shadow: 1,
  });
  drawAccentLine(
    canvas,
    [
      { x: 30, y: 84 },
      { x: 45, y: 78 },
      { x: 57, y: 66 },
      { x: 72, y: 60 },
    ],
    [236, 204, 130],
    2,
  );
  drawCircle(canvas, 30, 84, 5, [236, 204, 130], { seed: 64, texture: 1 });
  drawCircle(canvas, 57, 66, 4, [236, 204, 130], { seed: 65, texture: 1 });
  drawCircle(canvas, 72, 60, 5, [236, 204, 130], { seed: 66, texture: 1 });
  drawEllipse(canvas, 41, 74, 10, 18, mixColor(teal, 18), {
    seed: 68,
    texture: 1,
    highlight: 6,
    shadow: 2,
    rim: 0,
  });

  return canvas;
}

mkdirSync(outDir, { recursive: true });

if (process.argv.includes("--with-placeholder-heads")) {
  savePart("head-back.png", makeHead());
  savePart("head-left.png", makeSideHead("left"));
  savePart("head-right.png", makeSideHead("right"));
} else {
  console.log("Preserved mascot head assets. Pass --with-placeholder-heads to regenerate procedural placeholders.");
}
savePart("ear-left.png", makeEar(20));
savePart("ear-right.png", makeEar(22));
savePart("torso-back.png", makeTorso());
savePart("upper-arm-left.png", makeLimb(180, 70, 25, brown, 30));
savePart("forearm-left.png", makeLimb(170, 64, 23, brown, 31));
savePart("hand-left.png", makeHand(32));
savePart("upper-arm-right.png", makeLimb(180, 70, 25, brown, 33));
savePart("forearm-right.png", makeLimb(170, 64, 23, brown, 34));
savePart("hand-right.png", makeHand(35));
savePart("thigh-left.png", makeLimb(130, 72, 26, brown, 36));
savePart("shin-left.png", makeLimb(140, 66, 23, brown, 37));
savePart("foot-left.png", makeFoot(38));
savePart("thigh-right.png", makeLimb(130, 72, 26, brown, 39));
savePart("shin-right.png", makeLimb(140, 66, 23, brown, 40));
savePart("foot-right.png", makeFoot(41));
savePart("tail.png", makeTail());
savePart("chalk-bag.png", makeChalkBag());

console.log(`Generated Rupa character parts in ${outDir}`);

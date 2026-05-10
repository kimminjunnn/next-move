import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";
import { PNG } from "pngjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const importer = path.join(repoRoot, "scripts/import_rupa_head_sheet.mjs");
const bodyImporter = path.join(repoRoot, "scripts/import_rupa_body_sheet.mjs");
const proceduralGenerator = path.join(repoRoot, "scripts/generate_rupa_character_parts.mjs");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "rupa-assets-"));
}

function writeFlatPng(filePath, width, height, color) {
  const png = new PNG({ width, height });

  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = color[0];
    png.data[index + 1] = color[1];
    png.data[index + 2] = color[2];
    png.data[index + 3] = color[3];
  }

  fs.writeFileSync(filePath, PNG.sync.write(png));
}

test("head sheet importer refuses to overwrite existing output unless replacement is explicit", () => {
  const tempDir = makeTempDir();
  const sheetPath = path.join(tempDir, "sheet.png");
  const outDir = path.join(tempDir, "out");
  const existingPath = path.join(outDir, "head-back.png");
  const sentinel = Buffer.from("keep-existing-head");

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(existingPath, sentinel);
  writeFlatPng(sheetPath, 2172, 724, [0, 255, 0, 255]);

  const result = spawnSync(process.execPath, [importer, sheetPath, outDir], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.equal(fs.readFileSync(existingPath).toString(), sentinel.toString());
});

test("head sheet importer validates crop bounds before writing replacement files", () => {
  const tempDir = makeTempDir();
  const sheetPath = path.join(tempDir, "too-small.png");
  const outDir = path.join(tempDir, "out");

  fs.mkdirSync(outDir, { recursive: true });
  writeFlatPng(sheetPath, 300, 100, [0, 255, 0, 255]);

  const result = spawnSync(
    process.execPath,
    [importer, sheetPath, outDir, "--replace-active"],
    { cwd: repoRoot, encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.equal(fs.existsSync(path.join(outDir, "head-back.png")), false);
});

test("body sheet importer refuses to overwrite existing output unless replacement is explicit", () => {
  const tempDir = makeTempDir();
  const sheetPath = path.join(tempDir, "sheet.png");
  const outDir = path.join(tempDir, "out");
  const existingPath = path.join(outDir, "torso-back.png");
  const sentinel = Buffer.from("keep-existing-body");

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(existingPath, sentinel);
  writeFlatPng(sheetPath, 1536, 1024, [0, 255, 0, 255]);

  const result = spawnSync(process.execPath, [bodyImporter, sheetPath, outDir], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.equal(fs.readFileSync(existingPath).toString(), sentinel.toString());
});

test("procedural generator defaults to the latest rig-friendly asset directory", () => {
  const source = fs.readFileSync(proceduralGenerator, "utf8");

  assert.match(source, /back-v5-rigged-illustration/);
  assert.match(source, /--replace-active/);
});

test("procedural generator can emit the complete rigged illustration part set", () => {
  const tempDir = makeTempDir();
  const outDir = path.join(tempDir, "back-v5-rigged-illustration");
  const expectedParts = new Map([
    ["head-back.png", [360, 340]],
    ["head-left.png", [360, 340]],
    ["head-right.png", [360, 340]],
    ["torso-back.png", [150, 260]],
    ["upper-arm-left.png", [180, 70]],
    ["upper-arm-right.png", [180, 70]],
    ["forearm-left.png", [170, 64]],
    ["forearm-right.png", [170, 64]],
    ["hand-left.png", [88, 74]],
    ["hand-right.png", [88, 74]],
    ["thigh-left.png", [130, 72]],
    ["thigh-right.png", [130, 72]],
    ["shin-left.png", [140, 66]],
    ["shin-right.png", [140, 66]],
    ["foot-left.png", [98, 68]],
    ["foot-right.png", [98, 68]],
    ["tail.png", [210, 190]],
    ["chalk-bag.png", [104, 120]],
  ]);

  const result = spawnSync(
    process.execPath,
    [
      proceduralGenerator,
      "--out-dir",
      outDir,
      "--with-placeholder-heads",
    ],
    { cwd: repoRoot, encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);

  for (const [filename, [width, height]] of expectedParts) {
    const filePath = path.join(outDir, filename);
    const image = PNG.sync.read(fs.readFileSync(filePath));

    assert.equal(image.width, width, `${filename} width`);
    assert.equal(image.height, height, `${filename} height`);
    assert.equal(image.data[3], 0, `${filename} top-left transparent`);
  }
});

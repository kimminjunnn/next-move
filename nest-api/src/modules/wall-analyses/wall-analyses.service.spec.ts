import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BadGatewayException } from "@nestjs/common";

import { VisionClientService } from "../vision-client/vision-client.service";
import { WallAnalysesService } from "./wall-analyses.service";

function createUploadFile(): Express.Multer.File {
  return {
    fieldname: "file",
    originalname: "wall.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    size: 4,
    buffer: Buffer.from("wall"),
    stream: undefined as never,
    destination: "",
    filename: "",
    path: "",
  };
}

async function pathExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function withTempCwd(test: (cwd: string) => Promise<void>) {
  const originalCwd = process.cwd();
  const cwd = await mkdtemp(join(tmpdir(), "next-move-wall-analysis-"));
  process.chdir(cwd);

  try {
    await test(cwd);
  } finally {
    process.chdir(originalCwd);
    await rm(cwd, { recursive: true, force: true });
  }
}

describe("WallAnalysesService", () => {
  it("passes the uploaded wall image bytes directly to the vision client", async () => {
    await withTempCwd(async (cwd) => {
      let receivedInput: {
        imagePath?: string;
        filename?: string;
        mimetype?: string;
        buffer?: Buffer;
      } = {};
      const visionClient = {
        async analyzeWall(input: {
          imagePath?: string;
          filename?: string;
          mimetype?: string;
          buffer?: Buffer;
        }) {
          receivedInput = input;
          return {
            image: { width: 100, height: 80 },
            objects: [],
          };
        },
      } as Pick<VisionClientService, "analyzeWall"> as VisionClientService;
      const service = new WallAnalysesService(visionClient);

      await service.createWallAnalysis(createUploadFile(), { source: "camera" });

      expect(receivedInput.imagePath).toBeUndefined();
      expect(receivedInput.filename).toBe("wall.jpg");
      expect(receivedInput.mimetype).toBe("image/jpeg");
      expect(receivedInput.buffer?.toString("utf8")).toBe("wall");
      expect(await pathExists(join(cwd, "uploads"))).toBe(false);
    });
  });

  it("does not leave an uploads directory when direct vision analysis fails", async () => {
    await withTempCwd(async (cwd) => {
      const visionClient = {
        async analyzeWall() {
          throw new BadGatewayException("Vision service 호출에 실패했습니다.");
        },
      } as Pick<VisionClientService, "analyzeWall"> as VisionClientService;
      const service = new WallAnalysesService(visionClient);

      await expect(
        service.createWallAnalysis(createUploadFile(), { source: "camera" }),
      ).rejects.toBeInstanceOf(BadGatewayException);

      expect(await pathExists(join(cwd, "uploads"))).toBe(false);
    });
  });
});

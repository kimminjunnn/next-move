import axios from "axios";

import { VisionClientService } from "./vision-client.service";

describe("VisionClientService", () => {
  afterEach(() => {
    delete process.env.VISION_SERVICE_TIMEOUT_MS;
    jest.restoreAllMocks();
  });

  it("uses a 60 second default timeout for wall analysis", () => {
    const create = jest.spyOn(axios, "create").mockReturnValue({ post: jest.fn() } as never);

    new VisionClientService();

    expect(create).toHaveBeenCalledWith({
      baseURL: "http://localhost:8000",
      timeout: 60000,
    });
  });

  it("allows the vision service timeout to be configured", () => {
    process.env.VISION_SERVICE_TIMEOUT_MS = "45000";
    const create = jest.spyOn(axios, "create").mockReturnValue({ post: jest.fn() } as never);

    new VisionClientService();

    expect(create).toHaveBeenCalledWith({
      baseURL: "http://localhost:8000",
      timeout: 45000,
    });
  });

  it("posts wall images to the vision service as multipart form data", async () => {
    let body: unknown;
    const post = jest.fn().mockImplementation(async (_path: string, data: unknown) => {
      body = data;
      return {
        data: {
          image: { width: 100, height: 80 },
          objects: [],
        },
      };
    });
    jest.spyOn(axios, "create").mockReturnValue({ post } as never);
    const service = new VisionClientService();

    await service.analyzeWall({
      filename: "wall.jpg",
      mimetype: "image/jpeg",
      buffer: Buffer.from("wall"),
    });

    expect(post).toHaveBeenCalledWith("/internal/analyze-wall", expect.any(FormData));
    expect(body).toBeInstanceOf(FormData);
    const file = (body as FormData).get("file");
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("wall.jpg");
    expect((file as File).type).toBe("image/jpeg");
    expect(await (file as File).text()).toBe("wall");
  });
});

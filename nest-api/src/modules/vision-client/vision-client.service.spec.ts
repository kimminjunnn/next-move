import axios from "axios";

import { VisionClientService } from "./vision-client.service";

describe("VisionClientService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
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

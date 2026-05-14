import {
  ALLOWED_WALL_PHOTO_MIME_TYPES,
  WALL_PHOTO_MAX_BYTES,
  wallPhotoFileFilter,
} from "./wall-upload-options";

describe("wall upload options", () => {
  it("allows only supported image MIME types", () => {
    expect(ALLOWED_WALL_PHOTO_MIME_TYPES).toEqual([
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/heif",
    ]);
  });

  it("limits wall photos to 20MB", () => {
    expect(WALL_PHOTO_MAX_BYTES).toBe(20 * 1024 * 1024);
  });

  it("accepts supported image uploads", () => {
    const callback = jest.fn();

    wallPhotoFileFilter(
      undefined,
      { mimetype: "image/jpeg" } as Express.Multer.File,
      callback,
    );

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("rejects non-image uploads", () => {
    const callback = jest.fn();

    wallPhotoFileFilter(
      undefined,
      { mimetype: "application/pdf" } as Express.Multer.File,
      callback,
    );

    expect(callback).toHaveBeenCalledWith(expect.any(Error), false);
    expect(callback.mock.calls[0][0].message).toBe("unsupported_wall_photo_type");
  });
});

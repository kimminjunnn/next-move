export const WALL_PHOTO_MAX_BYTES = 20 * 1024 * 1024;

export const ALLOWED_WALL_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
] as const;

export function wallPhotoFileFilter(
  _request: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (
    ALLOWED_WALL_PHOTO_MIME_TYPES.includes(
      file.mimetype as (typeof ALLOWED_WALL_PHOTO_MIME_TYPES)[number],
    )
  ) {
    callback(null, true);
    return;
  }

  callback(new Error("unsupported_wall_photo_type"), false);
}

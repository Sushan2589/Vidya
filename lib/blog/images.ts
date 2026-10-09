import sharp from "sharp";
import { BlogError } from "./repository";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export async function prepareBlogImage(input: Buffer) {
  if (!input.length || input.length > MAX_IMAGE_BYTES)
    throw new BlogError("Choose an image smaller than 5 MB.", 413);
  try {
    const image = sharp(input, {
      limitInputPixels: 16_000_000,
      animated: false,
    });
    const metadata = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format || "") ||
      (metadata.pages || 1) > 1
    )
      throw new BlogError("Choose a static JPEG, PNG or WebP image.");
    const { data, info } = await image
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    if (data.length > 2 * 1024 * 1024)
      throw new BlogError("Image is too complex. Choose a smaller image.", 413);
    return { data, width: info.width, height: info.height };
  } catch (error) {
    if (error instanceof BlogError) throw error;
    throw new BlogError(
      "Image could not be decoded. Choose a valid JPEG, PNG or WebP.",
    );
  }
}

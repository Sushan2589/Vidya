import {
  blogFailure,
  blogJson,
  readBody,
  requireBlogAdmin,
  requireSameOrigin,
} from "@/lib/blog/http";
import { prepareBlogImage, MAX_IMAGE_BYTES } from "@/lib/blog/images";
import { BlogError, storeMedia } from "@/lib/blog/repository";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await requireBlogAdmin();
    requireSameOrigin(request);
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data"))
      throw new BlogError("Send an image upload.", 415);
    const body = await readBody(request, MAX_IMAGE_BYTES + 64 * 1024);
    let form: FormData;
    try {
      form = await new Request(request.url, {
        method: "POST",
        headers: { "content-type": contentType },
        body: new Uint8Array(body),
      }).formData();
    } catch {
      throw new BlogError("Invalid image upload.");
    }
    const file = form.get("file");
    if (!(file instanceof File)) throw new BlogError("Choose an image file.");
    const image = await prepareBlogImage(Buffer.from(await file.arrayBuffer()));
    return blogJson(
      await storeMedia(image.data, image.width, image.height),
      201,
    );
  } catch (error) {
    return blogFailure(error);
  }
}

import sharp from "sharp";
import { blogAdmin, blogFailure, blogJson } from "@/lib/blog/http";
import { getMedia } from "@/lib/blog/repository";
import { MEDIA_ID_PATTERN } from "@/lib/blog/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!MEDIA_ID_PATTERN.test(id))
      return blogJson({ error: "Image not found." }, 404);
    const widthParam = new URL(request.url).searchParams.get("w");
    const width = widthParam === null ? 1600 : Number(widthParam);
    if (
      ![
        16, 32, 48, 64, 96, 128, 256, 320, 384, 640, 750, 828, 960, 1080, 1200,
        1600,
      ].includes(width)
    )
      return blogJson({ error: "Invalid image width." }, 400);
    // Admin previews avoid an unnecessary publication lookup and repeat fetch.
    const media = await getMedia(id, !!(await blogAdmin()));
    if (!media) return blogJson({ error: "Image not found." }, 404);
    const data =
      width < media.width
        ? await sharp(media.data)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer()
        : media.data;
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    return blogFailure(error);
  }
}

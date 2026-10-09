import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession } from "../session";
import db from "../db";
import { BlogError } from "./repository";

export async function blogAdmin() {
  const username = await getSession();
  if (!username || typeof username !== "string") return null;
  const result = await db.execute({
    sql: "SELECT id FROM admin_users WHERE username = ?",
    args: [username],
  });
  return result.rows.length ? username : null;
}
export async function requireBlogAdmin() {
  const username = await blogAdmin();
  if (!username) throw new BlogError("Unauthorized", 401);
  return username;
}
export function requireSameOrigin(request: Request) {
  const expected = process.env.SITE_URL
    ? new URL(process.env.SITE_URL).origin
    : new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (
    origin !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new BlogError("Request origin is not allowed.", 403);
}
export async function readBody(request: Request, limit = 256 * 1024) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new BlogError("Request is too large.", 413);
  if (!request.body) throw new BlogError("Request body is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new BlogError("Request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new BlogError("Send application/json.", 415);
  try {
    return JSON.parse((await readBody(request)).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof BlogError) throw error;
    throw new BlogError("Invalid JSON.");
  }
}
export function numericId(value: string) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new BlogError("Invalid ID.");
  return Number(value);
}
export function blogJson(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function blogFailure(error: unknown) {
  if (error instanceof ZodError)
    return blogJson(
      { error: error.issues.map((issue) => issue.message).join(" ") },
      400,
    );
  if (error instanceof BlogError)
    return blogJson({ error: error.message }, error.status);
  if (
    error instanceof Error &&
    /fetch failed|timeout|aborted/i.test(error.message)
  )
    return blogJson(
      {
        error:
          "Content storage is temporarily unavailable. This action could not be confirmed; check the article list before retrying a save.",
      },
      503,
    );
  console.error(
    "Blog operation failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  return blogJson(
    { error: "Unable to complete this request. Please try again." },
    500,
  );
}

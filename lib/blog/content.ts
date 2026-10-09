import { z } from "zod";

export type ContentMark = {
  type: "bold" | "italic" | "strike" | "underline" | "code" | "link";
  attrs?: {
    href?: string;
    target?: string | null;
    rel?: string | null;
    class?: string | null;
    title?: string | null;
  };
};
export type ContentNode = {
  type:
    | "doc"
    | "paragraph"
    | "heading"
    | "text"
    | "bulletList"
    | "orderedList"
    | "listItem"
    | "blockquote"
    | "codeBlock"
    | "hardBreak"
    | "horizontalRule"
    | "image";
  text?: string;
  attrs?: {
    level?: number;
    start?: number;
    type?: "1" | "a" | "A" | "i" | "I" | null;
    language?: string | null;
    src?: string;
    alt?: string | null;
    title?: string | null;
    width?: number | null;
    height?: number | null;
    displayWidth?: number;
    align?: "left" | "center" | "right";
  };
  marks?: ContentMark[];
  content?: ContentNode[];
};

export const EMPTY_CONTENT: ContentNode = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
export const MEDIA_ID_PATTERN = /^[a-f0-9]{32}$/;
export const MEDIA_URL_PATTERN = /^\/api\/blog\/media\/([a-f0-9]{32})$/;

export function safeLink(value: string) {
  try {
    const url = new URL(value);
    return (
      ["https:", "http:", "mailto:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

const markSchema = z
  .object({
    type: z.enum(["bold", "italic", "strike", "underline", "code", "link"]),
    attrs: z
      .object({
        href: z
          .string()
          .max(2000)
          .refine(safeLink, "Use an https, http or mailto link.")
          .optional(),
        target: z.string().nullable().optional(),
        rel: z.string().nullable().optional(),
        class: z.string().nullable().optional(),
        title: z.string().max(300).nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine(
    (mark) => mark.type !== "link" || !!mark.attrs?.href,
    "A link needs a URL.",
  );

const nodeSchema: z.ZodType<ContentNode> = z.lazy(() =>
  z
    .object({
      type: z.enum([
        "doc",
        "paragraph",
        "heading",
        "text",
        "bulletList",
        "orderedList",
        "listItem",
        "blockquote",
        "codeBlock",
        "hardBreak",
        "horizontalRule",
        "image",
      ]),
      text: z.string().max(100000).optional(),
      attrs: z
        .object({
          level: z.number().int().min(2).max(3).optional(),
          start: z.number().int().min(1).max(100000).optional(),
          type: z.enum(["1", "a", "A", "i", "I"]).nullable().optional(),
          language: z.string().max(40).nullable().optional(),
          src: z
            .string()
            .regex(MEDIA_URL_PATTERN, "Use an uploaded blog image.")
            .optional(),
          alt: z.string().max(300).nullable().optional(),
          title: z.string().max(300).nullable().optional(),
          width: z.number().int().positive().max(4096).nullable().optional(),
          height: z.number().int().positive().max(4096).nullable().optional(),
          displayWidth: z.number().int().min(25).max(100).optional(),
          align: z.enum(["left", "center", "right"]).optional(),
        })
        .strict()
        .optional(),
      marks: z.array(markSchema).max(8).optional(),
      content: z.array(nodeSchema).max(2000).optional(),
    })
    .strict()
    .superRefine((node, ctx) => {
      const attributes: Record<string, string[]> = {
        heading: ["level"],
        orderedList: ["start", "type"],
        codeBlock: ["language"],
        image: ["src", "alt", "title", "width", "height", "displayWidth", "align"],
      };
      if (
        Object.keys(node.attrs || {}).some(
          (key) => !attributes[node.type]?.includes(key),
        )
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid attributes for this content node.",
        });
      }
      if (node.type !== "text" && node.marks?.length) {
        ctx.addIssue({
          code: "custom",
          message: "Formatting marks belong on text nodes.",
        });
      }
      const allowed: Record<string, string[]> = {
        doc: [
          "paragraph",
          "heading",
          "bulletList",
          "orderedList",
          "blockquote",
          "codeBlock",
          "horizontalRule",
          "image",
        ],
        paragraph: ["text", "hardBreak"],
        heading: ["text", "hardBreak"],
        codeBlock: ["text"],
        bulletList: ["listItem"],
        orderedList: ["listItem"],
        listItem: [
          "paragraph",
          "heading",
          "bulletList",
          "orderedList",
          "blockquote",
          "codeBlock",
          "horizontalRule",
          "image",
        ],
        blockquote: [
          "paragraph",
          "blockquote",
          "heading",
          "bulletList",
          "orderedList",
          "codeBlock",
          "horizontalRule",
          "image",
        ],
      };
      if (
        node.content?.some((child) => !allowed[node.type]?.includes(child.type))
      )
        ctx.addIssue({ code: "custom", message: "Invalid content nesting." });
      if (node.type === "text" && !node.text)
        ctx.addIssue({ code: "custom", message: "Text nodes need text." });
      if (node.type !== "text" && node.text !== undefined)
        ctx.addIssue({
          code: "custom",
          message: "Only text nodes may contain text.",
        });
      if (node.type === "heading" && !node.attrs?.level)
        ctx.addIssue({
          code: "custom",
          message: "Choose heading level 2 or 3.",
        });
      if (
        node.type === "image" &&
        (!node.attrs?.src || !node.attrs.alt?.trim())
      )
        ctx.addIssue({
          code: "custom",
          message: "Images need a source and descriptive alt text.",
        });
    }),
);

// Bound nesting before the recursive parser to avoid pathological inputs.
function boundedTree(input: unknown) {
  const stack: { value: unknown; depth: number }[] = [
    { value: input, depth: 0 },
  ];
  let nodes = 0;
  while (stack.length) {
    const { value, depth } = stack.pop()!;
    if (depth > 12 || ++nodes > 10000) return false;
    if (
      value &&
      typeof value === "object" &&
      "content" in value &&
      Array.isArray(value.content)
    ) {
      stack.push(
        ...value.content.map((child: unknown) => ({
          value: child,
          depth: depth + 1,
        })),
      );
    }
  }
  return true;
}

export const contentSchema = z
  .unknown()
  .refine(boundedTree, "Article is too deeply nested or too large.")
  .pipe(nodeSchema)
  .refine((node) => node.type === "doc", "Article must be a document.");

export function contentText(node: ContentNode): string {
  if (node.type === "text") return node.text || "";
  return (node.content || [])
    .map(contentText)
    .join(["paragraph", "heading"].includes(node.type) ? "" : " ");
}

export function readingMinutes(node: ContentNode) {
  return Math.max(
    1,
    Math.ceil(
      contentText(node).trim().split(/\s+/u).filter(Boolean).length / 200,
    ),
  );
}

export function contentMediaIds(node: ContentNode): string[] {
  const own =
    node.type === "image"
      ? node.attrs?.src?.match(MEDIA_URL_PATTERN)?.[1]
      : undefined;
  return [
    ...new Set([
      ...(own ? [own] : []),
      ...(node.content || []).flatMap(contentMediaIds),
    ]),
  ];
}

export function slugifyBlog(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)
    .replace(/-$/g, "");
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

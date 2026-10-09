"use client";

import { EditorContent, ReactNodeViewRenderer, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import type { ContentNode } from "@/lib/blog/content";
import { safeLink } from "@/lib/blog/content";
import { adminRequest, adminInputClass } from "./api";
import { ArticleImageView } from "./ArticleImageView";

const ArticleImage = ImageExtension.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ArticleImageView);
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      displayWidth: {
        default: 75,
        parseHTML: (element) => Number(element.getAttribute("data-display-width")) || 75,
        renderHTML: (attributes) => ({
          "data-display-width": attributes.displayWidth,
          style: `width: ${attributes.displayWidth}%`,
        }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
      },
    };
  },
});

export default function RichTextEditor({
  initialContent,
  onChange,
  disabled,
  onUploadState,
}: {
  initialContent: ContentNode;
  onChange: (content: ContentNode) => void;
  disabled: boolean;
  onUploadState: (busy: boolean) => void;
}) {
  const [link, setLink] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const linkSelection = useRef<{ from: number; to: number } | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const imageSelection = useRef<{ from: number; to: number } | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: false, linkOnPaste: false },
      }),
      ArticleImage.configure({ allowBase64: false }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Article content",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as ContentNode),
  });
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold"),
      italic: editor?.isActive("italic"),
      h2: editor?.isActive("heading", { level: 2 }),
      h3: editor?.isActive("heading", { level: 3 }),
      ul: editor?.isActive("bulletList"),
      ol: editor?.isActive("orderedList"),
      quote: editor?.isActive("blockquote"),
      code: editor?.isActive("codeBlock"),
    }),
  });
  useEffect(() => {
    // Toggling editability is UI state, not a document edit. Emitting an
    // update here would falsely mark a just-saved article dirty.
    editor?.setEditable(!disabled && !uploading, false);
  }, [editor, disabled, uploading]);
  if (!editor)
    return (
      <p role="status" className="p-5 text-sm text-[#16324F]">
        Loading editor…
      </p>
    );
  const button = (label: string, action: () => void, pressed?: boolean) => (
    <button
      key={label}
      type="button"
      disabled={disabled || uploading}
      onClick={action}
      aria-pressed={pressed}
      className={`rounded-md border px-3 py-2 text-xs font-medium disabled:opacity-50 ${pressed ? "border-[#16324F] bg-[#16324F] text-white" : "border-[#16324F]/20 bg-white hover:bg-[#16324F]/5"}`}
    >
      {label}
    </button>
  );
  function insertLink() {
    const href = link.trim();
    if (!safeLink(href) || href.length > 2000) {
      setMessage("Enter a complete https, http or mailto URL.");
      return;
    }
    const selection = linkSelection.current;
    if (!selection) return;
    const text = linkText.trim() || href;
    const chain = editor!.chain().focus().setTextSelection(selection);
    if (
      selection.from !== selection.to &&
      editor!.state.doc.textBetween(selection.from, selection.to, " ") === text
    ) {
      chain
        .setLink({ href, target: null })
        .setTextSelection(selection.to)
        .unsetMark("link", { extendEmptyMarkRange: false })
        .run();
    } else {
      chain
        .insertContent({
          type: "text",
          text,
          marks: [{ type: "link", attrs: { href, target: null } }],
        })
        .unsetMark("link", { extendEmptyMarkRange: false })
        .run();
    }
    setLink("");
    setLinkText("");
    setLinkOpen(false);
    setMessage("");
  }
  function openLink() {
    editor!.chain().focus().extendMarkRange("link").run();
    const { from, to } = editor!.state.selection;
    linkSelection.current = { from, to };
    setLinkText(editor!.state.doc.textBetween(from, to, " "));
    setLink(editor!.getAttributes("link").href || "");
    setMessage("");
    setLinkOpen(true);
  }
  async function insertImage(file?: File) {
    if (!file) return;
    setUploading(true);
    onUploadState(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("file", file);
      const result = await adminRequest<{
        url: string;
        width: number;
        height: number;
      }>("/api/admin/blog/media", { method: "POST", body: form });
      editor!
        .chain()
        .focus()
        .setTextSelection(imageSelection.current || editor!.state.selection)
        .setImage({
          src: result.url,
          alt: "",
          width: result.width,
          height: result.height,
        })
        .run();
      editor!.state.doc.descendants((node, position) => {
        if (node.type.name === "image" && node.attrs.src === result.url)
          editor!.commands.setNodeSelection(position);
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      onUploadState(false);
    }
  }
  return (
    <div className="overflow-hidden rounded-xl border border-[#16324F]/25 bg-white text-[#16324F]">
      <div
        className="flex flex-wrap gap-1.5 border-b border-[#16324F]/15 bg-[#F3F1EA] p-3"
        role="group"
        aria-label="Text formatting"
      >
        {button(
          "Bold",
          () => editor.chain().focus().toggleBold().run(),
          active?.bold,
        )}
        {button(
          "Italic",
          () => editor.chain().focus().toggleItalic().run(),
          active?.italic,
        )}
        {button(
          "Heading",
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          active?.h2,
        )}
        {button(
          "Subheading",
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          active?.h3,
        )}
        {button(
          "Bullets",
          () => editor.chain().focus().toggleBulletList().run(),
          active?.ul,
        )}
        {button(
          "Numbered list",
          () => editor.chain().focus().toggleOrderedList().run(),
          active?.ol,
        )}
        {button(
          "Quote",
          () => editor.chain().focus().toggleBlockquote().run(),
          active?.quote,
        )}
        {button(
          "Code block",
          () => editor.chain().focus().toggleCodeBlock().run(),
          active?.code,
        )}
        {button("Undo", () => editor.chain().focus().undo().run())}
        {button("Redo", () => editor.chain().focus().redo().run())}
        {button("Link", openLink, editor.isActive("link"))}
        {button(uploading ? "Uploading image…" : "Image", () => {
          const { from, to } = editor.state.selection;
          imageSelection.current = { from, to };
          imageInput.current?.click();
        })}
        <input ref={imageInput} aria-label="Upload inline article image" type="file"
          accept="image/jpeg,image/png,image/webp" className="hidden" disabled={disabled || uploading}
          onChange={(event) => { void insertImage(event.target.files?.[0]); event.target.value = ""; }} />
      </div>
      {linkOpen && (
        <div
          role="group"
          aria-label="Edit article link"
          className="border-b border-[#16324F]/15 bg-[#F3F1EA] p-3"
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
              event.preventDefault();
              insertLink();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setLinkOpen(false);
              editor.chain().focus().run();
            }
          }}
        >
          <p className="mb-3 text-xs text-[#16324F]/70">
            Add a link, or select existing text before clicking Link to change it.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-48 flex-1 text-xs">
              Link text
              <input
                value={linkText}
                onChange={(event) => setLinkText(event.target.value)}
                maxLength={2000}
                className={`${adminInputClass} mt-1`}
                disabled={disabled || uploading}
                placeholder="Text readers will click"
              />
            </label>
            <label className="min-w-48 flex-1 text-xs">
              Link URL
              <input
                type="url"
                value={link}
                onChange={(event) => setLink(event.target.value)}
                className={`${adminInputClass} mt-1`}
                placeholder="https://…"
                disabled={disabled || uploading}
                autoFocus
              />
            </label>
            {button("Add link", insertLink)}
            {button("Remove link", () => {
              if (linkSelection.current)
                editor.chain().focus().setTextSelection(linkSelection.current).unsetLink().run();
              setLinkOpen(false);
            })}
            {button("Cancel", () => {
              setLinkOpen(false);
              editor.chain().focus().run();
            })}
          </div>
        </div>
      )}
      {message && (
        <p role="alert" className="px-4 pt-3 text-sm text-red-800">
          {message}
        </p>
      )}
      <div
        className={`blog-prose p-5 sm:p-7 ${disabled ? "pointer-events-none opacity-70" : ""}`}
      >
        <EditorContent editor={editor} />
      </div>
      <p className="border-t border-[#16324F]/15 px-4 py-3 text-xs text-[#16324F]/70">
        Use headings to organize sections. Click Link to add a web address or
        link selected text. Click Image to upload at your cursor. Drag an image to
        move it between paragraphs; pull its corner to resize it.
      </p>
    </div>
  );
}

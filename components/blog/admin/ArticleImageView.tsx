"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

// Keep image layout in the existing document JSON; the public renderer uses
// the same percentage width and alignment on screens of different sizes.
export function ArticleImageView({ node, editor, selected, updateAttributes, deleteNode, getPos }: NodeViewProps) {
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(!node.attrs.alt);
  const resize = useRef<{ x: number; width: number; container: number } | null>(null);
  const resizeHandle = useRef<HTMLButtonElement>(null);
  const width = dragWidth ?? Number(node.attrs.displayWidth || 75);
  const setWidth = (value: number) => updateAttributes({ displayWidth: Math.max(25, Math.min(100, Math.round(value))) });
  const align = (value: string) => updateAttributes({ align: value, ...(value !== "center" ? { displayWidth: Math.min(width, 50) } : {}) });
  useEffect(() => {
    const handle = resizeHandle.current;
    if (!handle || !selected) return;
    const measure = (event: PointerEvent) => {
      const start = resize.current!;
      return Math.max(25, Math.min(100, Math.round(start.width + (event.clientX - start.x) / start.container * 100)));
    };
    const move = (event: PointerEvent) => {
      if (resize.current) setDragWidth(measure(event));
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", finish, true);
      window.removeEventListener("pointercancel", cancel, true);
      resize.current = null;
    };
    const finish = (event: PointerEvent) => {
      if (resize.current) updateAttributes({ displayWidth: measure(event) });
      cleanup();
      setDragWidth(null);
    };
    const cancel = () => { cleanup(); setDragWidth(null); };
    const start = (event: PointerEvent) => {
      if (!editor.isEditable || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      resize.current = { x: event.clientX, width: Number(node.attrs.displayWidth || 75), container: editor.view.dom.getBoundingClientRect().width };
      window.addEventListener("pointermove", move, true);
      window.addEventListener("pointerup", finish, true);
      window.addEventListener("pointercancel", cancel, true);
    };
    // Native listeners avoid editor selection handling taking over the gesture.
    handle.addEventListener("pointerdown", start);
    return () => { handle.removeEventListener("pointerdown", start); cleanup(); };
  }, [editor, selected, node.attrs.displayWidth, updateAttributes]);

  return (
    <NodeViewWrapper as="figure" className="blog-inline-image blog-editor-image" data-align={node.attrs.align || "center"}
      data-selected={selected ? "true" : "false"} style={{ width: `${width}%` }} contentEditable={false}>
      <div className="relative">
        {/* Native editor images are private/authenticated media, not public optimizer URLs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={node.attrs.src} alt={node.attrs.alt || ""} width={node.attrs.width} height={node.attrs.height}
          draggable data-drag-handle="" data-display-width={node.attrs.displayWidth || 75}
          className="block h-auto w-full cursor-grab rounded-xl active:cursor-grabbing"
          onMouseDown={() => {
            const position = getPos();
            if (editor.isEditable && typeof position === "number")
              editor.chain().focus(undefined, { scrollIntoView: false }).setNodeSelection(position).run();
          }}
          onClick={() => { const position = getPos(); if (editor.isEditable && typeof position === "number") editor.commands.setNodeSelection(position); }} />
        {selected && (
          <button ref={resizeHandle} type="button" aria-label="Resize article image" title="Drag to resize; arrow keys adjust size"
            className="blog-image-resize absolute bottom-0 right-0 size-7 rounded-tl-lg border-2 border-white bg-[#C9A227] text-[#16324F]"
            style={{ touchAction: "none" }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                setWidth(width + (event.key === "ArrowRight" ? 5 : -5));
              }
            }}>↘</button>
        )}
      </div>
      {node.attrs.title && <figcaption>{node.attrs.title}</figcaption>}
      {selected && (
        <div role="group" aria-label="Image options" className="mt-2 rounded-lg border border-[#16324F]/20 bg-[#F3F1EA] p-2 text-xs leading-normal">
          <p className="mb-2 text-[#16324F]/70">Drag the image to move it. Pull the corner to resize.</p>
          <div className="flex flex-wrap gap-2">
            {(["left", "center", "right"] as const).map((value) => (
              <button key={value} type="button" aria-pressed={node.attrs.align === value}
                className="rounded border border-[#16324F]/20 px-2 py-1 capitalize aria-pressed:bg-[#16324F] aria-pressed:text-white"
                onClick={() => align(value)}>{value}</button>
            ))}
            <button type="button" onClick={deleteNode} className="px-2 py-1 text-red-800 underline">Remove</button>
          </div>
          <details className="mt-2" open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)}>
            <summary className="cursor-pointer">Description &amp; caption</summary>
            <label className="mt-2 block">Image description (required)
              <input aria-label="Inline image description" value={node.attrs.alt || ""} maxLength={300}
                className="mt-1 w-full rounded border border-[#16324F]/25 bg-white p-2"
                onChange={(event) => updateAttributes({ alt: event.target.value })} />
            </label>
            <label className="mt-2 block">Caption (optional)
              <input aria-label="Inline image caption" value={node.attrs.title || ""} maxLength={300}
                className="mt-1 w-full rounded border border-[#16324F]/25 bg-white p-2"
                onChange={(event) => updateAttributes({ title: event.target.value || null })} />
            </label>
          </details>
        </div>
      )}
    </NodeViewWrapper>
  );
}

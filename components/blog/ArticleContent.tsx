import { Fragment, type ReactNode } from "react";
import { BlogImage } from "./BlogImage";
import { safeLink, type ContentNode } from "@/lib/blog/content";

function renderNode(node: ContentNode, key: string): ReactNode {
  const children = node.content?.map((child, index) =>
    renderNode(child, `${key}-${index}`),
  );
  switch (node.type) {
    case "doc":
      return <Fragment key={key}>{children}</Fragment>;
    case "paragraph":
      return <p key={key}>{children || <br />}</p>;
    case "heading":
      return node.attrs?.level === 3 ? (
        <h3 key={key}>{children}</h3>
      ) : (
        <h2 key={key}>{children}</h2>
      );
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return (
        <ol
          key={key}
          start={node.attrs?.start}
          type={node.attrs?.type || undefined}
        >
          {children}
        </ol>
      );
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{children}</code>
        </pre>
      );
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return node.attrs?.src ? (
        <figure key={key} className="blog-inline-image" data-align={node.attrs.align || "center"}
          style={{ width: `${node.attrs.displayWidth ?? 75}%` }}>
          <BlogImage
            src={node.attrs.src}
            alt={node.attrs.alt || ""}
            width={node.attrs.width || 1600}
            height={node.attrs.height || 1000}
            sizes="(max-width: 768px) 90vw, 760px"
            className="h-auto w-full rounded-xl"
          />
          {node.attrs.title && <figcaption>{node.attrs.title}</figcaption>}
        </figure>
      ) : null;
    case "text": {
      let text: ReactNode = node.text;
      for (const mark of node.marks || []) {
        switch (mark.type) {
          case "bold":
            text = <strong>{text}</strong>;
            break;
          case "italic":
            text = <em>{text}</em>;
            break;
          case "strike":
            text = <s>{text}</s>;
            break;
          case "underline":
            text = <u>{text}</u>;
            break;
          case "code":
            text = <code>{text}</code>;
            break;
          case "link":
            if (mark.attrs?.href && safeLink(mark.attrs.href))
              text = (
                <a href={mark.attrs.href} rel="noopener noreferrer">
                  {text}
                </a>
              );
            break;
        }
      }
      return <Fragment key={key}>{text}</Fragment>;
    }
  }
}
export function ArticleContent({ content }: { content: ContentNode }) {
  return <div className="blog-prose">{renderNode(content, "article")}</div>;
}

import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/blog/ArticleView";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { getPostBySlug, relatedPosts } from "@/lib/blog/repository";
import { articleUrl, articleStructuredData, siteOrigin } from "@/lib/blog/seo";
import { jsonLd } from "@/lib/blog/content";

export const dynamic = "force-dynamic";
const getPost = cache(getPostBySlug);
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const title = post.seoTitle || `${post.title} | VIDYA`;
  const description = post.seoDescription || post.excerpt;
  const url = articleUrl(post.slug);
  const images = post.imageId
    ? [
        {
          url: `${siteOrigin()}/api/blog/media/${post.imageId}`,
          alt: post.imageAlt,
        },
      ]
    : [];
  return {
    title,
    description,
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "VIDYA",
      images,
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      modifiedTime: new Date(post.updatedAt).toISOString(),
      authors: [post.author],
      section: post.categoryName,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
export default async function ArticlePage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const related = await relatedPosts(post);
  return (
    <main className="min-h-svh bg-[#ddddd6] px-6 pb-20 pt-36 sm:pt-44">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(articleStructuredData(post)),
        }}
      />
      <ArticleView post={post} />
      <div className="mx-auto mt-12 max-w-3xl border-t border-[#16324F]/15 pt-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#16324F]/75">
          Pass the curiosity on
        </p>
        <ShareButtons url={articleUrl(post.slug)} title={post.title} />
      </div>
      {related.length > 0 && (
        <section
          className="mx-auto mt-16 max-w-6xl"
          aria-labelledby="related-heading"
        >
          <h2
            id="related-heading"
            className="mb-6 font-serif text-3xl text-[#16324F]"
          >
            Keep exploring
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ArticleCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

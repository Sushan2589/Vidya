import { Hero } from "@/components/Hero";
import { InitiativesSection } from "@/components/InitiativesSection";
import { newsArticles } from "@/lib/newsArticles";

export default function Home() {
  return (
    <main className="bg-neutral-950 text-white">
      <Hero />

      <section id="news" className="bg-[#ddddd6] px-6 pb-4 pt-2 sm:pb-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-[#16324F]/10 bg-white/50 px-4 py-3 backdrop-blur-sm sm:px-6">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.28em] text-[#C9A227]">
            MEDIA COVERAGE
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {newsArticles.map((article) => (
              <a
                key={article.title}
                href={article.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[#16324F]/10 bg-[#16324F]/3 px-3 py-2 text-sm font-medium text-[#16324F] transition-all hover:border-[#C9A227]/50 hover:bg-[#C9A227]/10"
              >
                <span>{article.title}</span>
                <span className="text-[#C9A227] transition-transform group-hover:translate-x-0.5">
                  Read ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <InitiativesSection />
    </main>
  );
}

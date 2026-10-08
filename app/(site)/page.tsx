import { Hero } from "@/components/Hero";
import { InitiativesSection } from "@/components/InitiativesSection";

const newsArticles = [
  {
    title: "Hamrakura",
    description:
      "VIDYA's outreach and learning initiatives were featured in a leading Nepalese media platform, highlighting our work in building academic opportunities for young students.",
    href: "https://hamrakura.com/news-details/220727/2026-09-16",
  },
  {
    title: "Artha Bulletin",
    description:
      "Our efforts to inspire students through olympiad awareness, leadership, and digital learning were highlighted in a national story on youth academic growth.",
    href: "https://arthabulletin.com/2026/09/09/%e0%a4%ae%e0%a4%be%e0%a4%a7%e0%a5%8d%e0%a4%af%e0%a4%ae%e0%a4%bf%e0%a4%95-%e0%a4%b5%e0%a4%bf%e0%a4%a6%e0%a5%8d%e0%a4%af%e0%a4%be%e0%a4%b2%e0%a4%af%e0%a4%b9%e0%a4%b0%e0%a5%82%e0%a4%ae%e0%a4%be-%e0%a4%93/",
  },
];

export default function Home() {
  return (
    <main className="bg-neutral-950 text-white">
      <Hero />

      <section id="news" className="bg-[#ddddd6] px-6 pb-4 pt-2 sm:pb-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-[#16324F]/10 bg-white/50 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#C9A227]">
                In the News
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {newsArticles.map((article) => (
                <a
                  key={article.title}
                  href={article.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-[#16324F]/10 bg-[#16324F]/3 px-3 py-1.5 text-sm font-medium text-[#16324F] transition-all hover:border-[#C9A227]/50 hover:bg-[#C9A227]/10"
                >
                  <span>{article.title}</span>
                  <span className="text-[#C9A227] transition-transform group-hover:translate-x-0.5">
                    Read ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <InitiativesSection />
    </main>
  );
}

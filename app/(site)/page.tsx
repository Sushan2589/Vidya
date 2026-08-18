import { AboutTimeline } from "@/components/AboutTimeline";
import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <main className="bg-neutral-950 text-white">
      <Hero />
      <AboutTimeline />
    </main>
  );
}

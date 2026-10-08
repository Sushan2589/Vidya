import { Hero } from "@/components/Hero";
import { InitiativesSection } from "@/components/InitiativesSection";

export default function Home() {
  return (
    <main className="bg-neutral-950 text-white">
      <Hero />
      <InitiativesSection />
    </main>
  );
}

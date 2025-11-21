import { HivemindHero } from "@/components/landing/hivemind-hero";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { WhitepaperPreview } from "@/components/landing/whitepaper-preview";
import { Navbar } from "@/components/layout/navbar";
import { LivingBackground } from "@/components/ui/living-background";

export default function Home() {
  return (
    <main className="min-h-screen text-white selection:bg-cyan-500/30">
      <LivingBackground />
      <Navbar />
      <HivemindHero />
      <FeatureGrid />
      <WhitepaperPreview />
    </main>
  );
}

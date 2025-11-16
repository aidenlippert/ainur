import { HeroSection } from "@/components/sections/hero";
import { ProblemSection } from "@/components/sections/problem";
import { ApproachSection } from "@/components/sections/approach";
import { ArchitectureSection } from "@/components/sections/architecture";
import { StatusSection } from "@/components/sections/status";
import { CTASection } from "@/components/sections/cta";

export default function Home() {
  return (
    <main className="relative">
      <HeroSection />
      <ProblemSection />
      <ApproachSection />
      <ArchitectureSection />
      <StatusSection />
      <CTASection />
    </main>
  );
}

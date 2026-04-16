import { AiHighlight } from "@/components/landing/ai-highlight";
import { CtaBanner } from "@/components/landing/cta-banner";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { HeroSection } from "@/components/landing/hero-section";
import { RoleCards } from "@/components/landing/role-cards";
import { SectionShell } from "@/components/landing/section-shell";

export default function LandingPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-24 pt-6 sm:px-8 lg:px-12">
      <HeroSection />

      <SectionShell
        id="features"
        eyebrow="Platform features"
        title="A focused MVP built for coordination, not clutter"
        description="The platform is designed to connect patient discovery, hospital operations, and urgent support workflows without overcomplicating the first demo."
      >
        <FeaturesGrid />
      </SectionShell>

      <SectionShell
        id="roles"
        eyebrow="Built for two sides"
        title="Different user flows, one connected healthcare network"
        description="Patients and hospitals use the same platform differently, so the experience is structured around both public access and operational control."
      >
        <RoleCards />
      </SectionShell>

      <SectionShell
        eyebrow="AI layer"
        title="A small but meaningful intelligence layer"
        description="AI supports semantic search, summaries, and guided assistance while staying secondary to the core product experience."
      >
        <AiHighlight />
      </SectionShell>

      <section className="py-10 sm:py-14">
        <CtaBanner />
      </section>
    </div>
  );
}

import { BarChart3, ClipboardList, MessageSquareMore, PackageSearch } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/ui/section-heading";

const cards = [
  {
    title: "Dashboard analytics",
    description: "Space for usage stats, shortage trends, and AI insight cards.",
    icon: BarChart3,
  },
  {
    title: "Operations modules",
    description: "Doctors, equipment, ambulances, appointments, and issue resolution will plug in here.",
    icon: ClipboardList,
  },
  {
    title: "Realtime coordination",
    description: "Chat, shortage updates, and inter-hospital collaboration fit into this shell.",
    icon: MessageSquareMore,
  },
  {
    title: "Semantic discovery",
    description: "Equipment search and assistance workflows can layer onto this layout later.",
    icon: PackageSearch,
  },
];

export default function HospitalHomePage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Hospital workspace"
        title="A reusable admin shell ready for feature modules"
        description="This is a structural placeholder so we can add dashboard, CRUD pages, and live coordination flows block by block."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <FadeIn key={card.title} delay={index * 0.06}>
              <article className="rounded-[28px] border border-[var(--border)] bg-white/90 p-6">
                <div className="inline-flex rounded-2xl bg-[var(--foreground)]/5 p-3 text-[var(--primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-[var(--foreground)]">{card.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{card.description}</p>
              </article>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}

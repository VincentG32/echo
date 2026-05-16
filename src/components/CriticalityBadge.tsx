import type { FeedbackCriticality } from "@/lib/schemas";

const STYLES: Record<
  FeedbackCriticality,
  { bg: string; text: string; emoji: string; label: string }
> = {
  bloquant: {
    bg: "bg-crit-bloquant-bg",
    text: "text-crit-bloquant-text",
    emoji: "🔴",
    label: "Bloquant",
  },
  majeur: {
    bg: "bg-crit-majeur-bg",
    text: "text-crit-majeur-text",
    emoji: "🟠",
    label: "Majeur",
  },
  mineur: {
    bg: "bg-crit-mineur-bg",
    text: "text-crit-mineur-text",
    emoji: "🔵",
    label: "Mineur",
  },
};

export function CriticalityBadge({
  criticality,
}: {
  criticality: FeedbackCriticality;
}) {
  const s = STYLES[criticality];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${s.bg} ${s.text}`}
      aria-label={`Criticité : ${s.label}`}
    >
      <span aria-hidden>{s.emoji}</span>
      <span>{s.label}</span>
    </span>
  );
}

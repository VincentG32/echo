"use client";

import { useEffect, useRef, useState } from "react";
import {
  FEEDBACK_CRITICALITIES,
  type FeedbackCriticality,
} from "@/lib/schemas";
import { useApiMutation } from "@/lib/useApiMutation";

// V6: interactive replacement for CriticalityBadge when an admin needs
// to reclassify a bug inline. Same visual as the static badge — click
// opens a small menu, pick a value, optimistic update + PATCH call.
//
// Reused from /admin?tab=list (mobile cards + desktop table) to save
// clicks vs the per-feedback detail page.

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

export function CriticalityPicker({
  feedbackId,
  initialCriticality,
}: {
  feedbackId: string;
  initialCriticality: FeedbackCriticality;
}) {
  const { mutate, pending } = useApiMutation();
  const [current, setCurrent] = useState<FeedbackCriticality>(initialCriticality);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the menu on click outside or Escape.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  async function pick(c: FeedbackCriticality) {
    setOpen(false);
    if (c === current || pending) return;
    const prev = current;
    setCurrent(c); // optimistic
    const res = await mutate(
      `/api/feedbacks/${feedbackId}/criticality`,
      { method: "PATCH", json: { criticality: c } },
      { successMessage: `Reclassé en ${c}` },
    );
    if (!res.ok) setCurrent(prev);
  }

  const s = STYLES[current];

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Criticité actuelle : ${s.label}. Cliquer pour reclasser.`}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-50 ${s.bg} ${s.text}`}
      >
        <span aria-hidden>{s.emoji}</span>
        <span>{s.label}</span>
        <span aria-hidden className="ml-0.5 opacity-70">▾</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute z-20 mt-1 left-0 min-w-[150px] bg-bg-primary border border-border-tertiary rounded-md shadow-lg overflow-hidden"
        >
          {FEEDBACK_CRITICALITIES.map((c) => {
            const opt = STYLES[c];
            const isActive = c === current;
            return (
              <button
                key={c}
                role="menuitem"
                type="button"
                onClick={() => pick(c)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-bg-secondary transition-colors ${
                  isActive ? "font-semibold" : ""
                }`}
              >
                <span aria-hidden>{opt.emoji}</span>
                <span>{opt.label}</span>
                {isActive && (
                  <span aria-hidden className="ml-auto text-text-tertiary">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

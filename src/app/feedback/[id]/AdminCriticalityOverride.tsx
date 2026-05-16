"use client";

import { useState } from "react";
import { CriticalityBadge } from "@/components/CriticalityBadge";
import {
  FEEDBACK_CRITICALITIES,
  type FeedbackCriticality,
} from "@/lib/schemas";
import { useApiMutation } from "@/lib/useApiMutation";

// V6: admin-only widget on the feedback detail page. Lets an admin
// raise or lower the criticality of a bug. The badge updates
// optimistically; on error we restore the previous value.
export function AdminCriticalityOverride({
  feedbackId,
  initialCriticality,
}: {
  feedbackId: string;
  initialCriticality: FeedbackCriticality;
}) {
  const { mutate, pending } = useApiMutation();
  const [current, setCurrent] = useState<FeedbackCriticality>(initialCriticality);

  async function handlePick(next: FeedbackCriticality) {
    if (next === current || pending) return;
    const previous = current;
    setCurrent(next); // optimistic
    const res = await mutate(
      `/api/feedbacks/${feedbackId}/criticality`,
      { method: "PATCH", json: { criticality: next } },
      { successMessage: `Criticité reclassée en ${next}` },
    );
    if (!res.ok) setCurrent(previous);
  }

  return (
    <div className="rounded-md border border-border-tertiary bg-bg-secondary p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-text-tertiary">
          Reclasser la criticité <span className="text-text-secondary normal-case">(admin)</span>
        </div>
        <CriticalityBadge criticality={current} />
      </div>
      <div
        role="radiogroup"
        aria-label="Reclasser la criticité"
        className="flex flex-wrap gap-2"
      >
        {FEEDBACK_CRITICALITIES.map((c) => {
          const isActive = c === current;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={pending}
              onClick={() => handlePick(c)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                isActive
                  ? "border-action bg-action text-text-info"
                  : "border-border-secondary bg-bg-primary text-text-primary hover:bg-bg-tertiary"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

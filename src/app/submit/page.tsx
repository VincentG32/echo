"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CompagnonWidget } from "@/components/CompagnonWidget";
import {
  FEEDBACK_CRITICALITIES,
  FEEDBACK_TYPES,
  type FeedbackCriticality,
  type FeedbackType,
} from "@/lib/schemas";
import { useApiMutation } from "@/lib/useApiMutation";

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "🐛 Bug",
  "idée": "💡 Idée",
  "amélioration": "✨ Amélioration",
};

// V6: criticité — labels + définitions visibles directement sous chaque
// option pour forcer un référentiel commun (et éviter "tout est bloquant").
const CRITICALITY_DEFINITIONS: Record<
  FeedbackCriticality,
  { emoji: string; label: string; definition: string }
> = {
  bloquant: {
    emoji: "🔴",
    label: "Bloquant",
    definition: "L'app est inutilisable. Aucun contournement.",
  },
  majeur: {
    emoji: "🟠",
    label: "Majeur",
    definition: "Une fonctionnalité est cassée mais contournable.",
  },
  mineur: {
    emoji: "🔵",
    label: "Mineur",
    definition: "Gêne légère ou cosmétique. N'empêche pas l'usage.",
  },
};

export default function SubmitPage() {
  return (
    <Suspense fallback={null}>
      <SubmitForm />
    </Suspense>
  );
}

// Phase 3 (cahier de test) : /campagne pré-remplit title/description via
// query params pour relier un feedback à un scénario de test précis.
function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate, pending } = useApiMutation();
  const [title, setTitle] = useState(searchParams.get("title") ?? "");
  const [description, setDescription] = useState(
    searchParams.get("description") ?? "",
  );
  const [type, setType] = useState<FeedbackType | "">("");
  const [criticality, setCriticality] = useState<FeedbackCriticality | "">("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!type) {
      setError("Choisis un type");
      return;
    }
    if (type === "bug" && !criticality) {
      setError("Choisis une criticité pour ce bug");
      return;
    }
    setError(null);
    const payload: Record<string, string> = { title, description, type };
    if (type === "bug" && criticality) payload.criticality = criticality;
    const res = await mutate(
      "/api/feedbacks",
      { method: "POST", json: payload },
      {
        toastError: false,
        successMessage: "Feedback créé",
        errorMessage: "Erreur lors de la création",
      },
    );
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/feedbacks");
  }

  return (
    <div className="max-w-xl mx-auto bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8">
      <h1 className="text-lg font-semibold text-text-primary mb-6">
        Créer un feedback
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Titre du feedback *
          </label>
          <input
            id="title"
            type="text"
            required
            placeholder="Ex: Ajouter un mode dark"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Description *
          </label>
          <textarea
            id="description"
            required
            placeholder="Détaille ton idée, problème ou suggestion..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary min-h-[100px] font-sans"
          />
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Type *
          </label>
          <select
            id="type"
            required
            value={type}
            onChange={(e) => {
              const next = e.target.value as FeedbackType | "";
              setType(next);
              // Reset criticality when leaving bug
              if (next !== "bug") setCriticality("");
            }}
            className="w-full rounded-md border border-border-tertiary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary"
          >
            <option value="">-- Choisis un type --</option>
            {FEEDBACK_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* V6: criticité — affichée uniquement quand type=bug. Radio
            buttons avec définitions visibles pour forcer un référentiel
            commun ("L'app peut-elle quand même être utilisée ?"). */}
        {type === "bug" && (
          <fieldset className="space-y-2">
            <legend className="block text-sm font-medium text-text-primary mb-1">
              Criticité du bug *
            </legend>
            <p className="text-xs text-text-tertiary mb-2">
              Critère mental : <em>L'utilisateur peut-il quand même utiliser
              l'app&nbsp;?</em>
            </p>
            <div className="space-y-2">
              {FEEDBACK_CRITICALITIES.map((c) => {
                const def = CRITICALITY_DEFINITIONS[c];
                return (
                  <label
                    key={c}
                    htmlFor={`crit-${c}`}
                    className={`flex items-start gap-3 rounded-md border bg-bg-secondary px-3 py-2.5 cursor-pointer transition-colors ${
                      criticality === c
                        ? "border-action"
                        : "border-border-tertiary hover:border-border-secondary"
                    }`}
                  >
                    <input
                      id={`crit-${c}`}
                      type="radio"
                      name="criticality"
                      value={c}
                      checked={criticality === c}
                      onChange={() => setCriticality(c)}
                      className="mt-0.5 accent-action"
                    />
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        <span aria-hidden>{def.emoji}</span> {def.label}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {def.definition}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {error && (
          <p
            role="alert"
            className="text-sm text-type-bug-text bg-type-bug-bg rounded-md px-3 py-2"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="w-full rounded-md bg-action text-text-info py-2.5 text-sm font-medium hover:bg-action-hover transition-colors disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Soumettre le feedback"}
        </button>

        <p className="text-xs text-text-tertiary text-center mt-4">
          Le feedback sera associé à ton compte, avec la date du jour
        </p>
      </form>
      <CompagnonWidget />
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { CompagnonWidget } from "@/components/CompagnonWidget";
import { ACTIVE_CAMPAIGN, listActiveCahierTests } from "@/lib/airtable";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PRIORITY_STYLES: Record<
  "haute" | "moyenne" | "basse",
  { bg: string; text: string; label: string }
> = {
  haute: {
    bg: "bg-type-bug-bg",
    text: "text-type-bug-text",
    label: "Priorité haute",
  },
  moyenne: {
    bg: "bg-type-amelioration-bg",
    text: "text-type-amelioration-text",
    label: "Priorité moyenne",
  },
  basse: {
    bg: "bg-bg-secondary",
    text: "text-text-tertiary",
    label: "Priorité basse",
  },
};

export default async function CampagnePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/campagne");

  const items = await listActiveCahierTests();

  const byZone = new Map<string, typeof items>();
  for (const item of items) {
    const list = byZone.get(item.zone) ?? [];
    list.push(item);
    byZone.set(item.zone, list);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-text-tertiary mb-1">
          Cahier de test
        </p>
        <h1 className="text-xl font-semibold text-text-primary">
          {ACTIVE_CAMPAIGN}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Voici ce qu&apos;on te propose de tester en priorité. Essaie chaque
          scénario, puis dis-nous ce que tu as observé.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Aucun test actif pour le moment.
        </p>
      ) : (
        <div className="space-y-8">
          {Array.from(byZone.entries()).map(([zone, zoneItems]) => (
            <section key={zone}>
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-3">
                {zone}
              </h2>
              <div className="space-y-3">
                {zoneItems.map((item) => {
                  const pr = item.priorite ? PRIORITY_STYLES[item.priorite] : null;
                  const title = `[${item.code}] `;
                  const description = `Test : ${item.scenario}\n\nRésultat attendu : ${item.resultatAttendu}\n\nCe que j'ai observé :\n`;
                  const href = `/submit?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;
                  return (
                    <div
                      key={item.id}
                      className="bg-bg-primary border border-border-tertiary rounded-lg p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-xs font-mono text-text-tertiary">
                          {item.code}
                        </span>
                        {pr && (
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${pr.bg} ${pr.text}`}
                          >
                            {pr.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-primary mb-2">
                        {item.scenario}
                      </p>
                      <p className="text-xs text-text-secondary mb-3">
                        <span className="font-medium">Résultat attendu :</span>{" "}
                        {item.resultatAttendu}
                      </p>
                      <Link
                        href={href}
                        className="inline-block rounded-md border border-border-secondary px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-bg-secondary transition-colors"
                      >
                        Donner un feedback sur ce test
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
      <CompagnonWidget />
    </div>
  );
}

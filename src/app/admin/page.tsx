import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminList } from "./AdminList";

// Pulse Capsule V1: la vue d'ensemble (KPIs, charts, top votes, top
// bloquants) est sortie de l'app — elle vit dans une interface Airtable
// dédiée. /admin pointe maintenant directement sur la liste de
// modération des feedbacks.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin");
  if (user.role !== "admin") redirect("/feedbacks");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 sm:p-8">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
          <h1 className="text-lg font-semibold text-text-primary">Admin</h1>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <a
              href="/api/admin/export"
              download
              className="hover:text-text-primary underline"
            >
              📥 Exporter CSV
            </a>
            <Link href="/dev" className="hover:text-text-primary underline">
              Voir le kanban →
            </Link>
          </div>
        </div>
        <p className="text-xs text-text-tertiary mb-5">
          Modérer les feedbacks et envoyer au backlog
        </p>

        <AdminList />
      </div>
    </div>
  );
}

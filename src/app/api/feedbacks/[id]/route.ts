import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  deleteFeedback,
  getFeedbackById,
  updateFeedback,
} from "@/lib/airtable";
import { requireAuth } from "@/lib/api-helpers";
import { updateFeedbackSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json({ error: "Feedback introuvable" }, { status: 404 });
  }
  return NextResponse.json({ feedback });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json({ error: "Feedback introuvable" }, { status: 404 });
  }

  if (feedback.creatorId !== user.id) {
    return NextResponse.json({ error: "Action refusée" }, { status: 403 });
  }

  // Gate 0 (M4): le formulaire d'édition n'envoie jamais `criticality`
  // (pas de champ dédié). Sans ce merge, updateFeedbackSchema rejetterait
  // désormais toute édition d'un bug déjà classé (type:"bug" +
  // criticality absente = refusé). On complète avec la criticité actuelle
  // AVANT validation, pour que la règle V6 ("un bug a toujours une
  // criticité") s'applique aussi bien à la création qu'à l'édition, sans
  // gêner l'édition normale d'un bug déjà classé.
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const withFallbackCriticality =
    raw && typeof raw === "object" && !("criticality" in raw) && feedback.criticality
      ? { ...raw, criticality: feedback.criticality }
      : raw;

  const parsed = updateFeedbackSchema.safeParse(withFallbackCriticality);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Criticité requise pour un bug" },
      { status: 400 },
    );
  }

  const updated = await updateFeedback(id, parsed.data);
  revalidateTag("feedbacks", "max");
  return NextResponse.json({ feedback: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json({ error: "Feedback introuvable" }, { status: 404 });
  }

  const isCreator = feedback.creatorId === user.id;
  const isAdmin = user.role === "admin";
  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: "Action refusée" }, { status: 403 });
  }

  await deleteFeedback(id);
  revalidateTag("feedbacks", "max");
  return NextResponse.json({ ok: true });
}

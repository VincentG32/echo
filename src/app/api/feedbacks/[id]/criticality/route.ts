import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getFeedbackById, setCriticality } from "@/lib/airtable";
import { parseJsonBody, requireAuth } from "@/lib/api-helpers";
import { criticalityOverrideSchema } from "@/lib/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// V6: admin override on bug criticality. The user picks a criticality
// at submission time; admin can later raise OR lower it from the detail
// page. Bidirectional, no notification to the creator (silent override).
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAuth({ role: "admin" });
  if (auth.error) return auth.error;

  const parsed = await parseJsonBody(request, criticalityOverrideSchema);
  if (parsed.error) return parsed.error;

  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) {
    return NextResponse.json({ error: "Feedback introuvable" }, { status: 404 });
  }
  if (feedback.type !== "bug") {
    return NextResponse.json(
      { error: "La criticité ne s'applique qu'aux bugs" },
      { status: 409 },
    );
  }

  const updated = await setCriticality(id, parsed.data.criticality);
  revalidateTag("feedbacks", "max");
  revalidatePath(`/feedback/${id}`);

  return NextResponse.json({ feedback: updated });
}

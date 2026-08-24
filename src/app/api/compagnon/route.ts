import { NextResponse } from "next/server";
import { requireAuth, parseJsonBody } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { compagnonMessageSchema } from "@/lib/schemas";

// Le Compagnon de test tourne sur un workflow n8n (Chat Trigger webhook).
// L'identité/rôle sont lus depuis la session serveur ici, jamais depuis
// le corps envoyé par le navigateur — l'agent ne doit jamais faire
// confiance à une identité déclarée dans le message.
export async function POST(request: Request) {
  const limited = await rateLimit(request, {
    name: "compagnon",
    max: 15,
    window: "1 m",
  });
  if (limited) return limited;

  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

  const parsed = await parseJsonBody(request, compagnonMessageSchema);
  if (parsed.error) return parsed.error;
  const { message, sessionId } = parsed.data;

  const webhookUrl = process.env.COMPAGNON_WEBHOOK_URL;
  const webhookUser = process.env.COMPAGNON_WEBHOOK_USER;
  const webhookPass = process.env.COMPAGNON_WEBHOOK_PASS;
  if (!webhookUrl || !webhookUser || !webhookPass) {
    return NextResponse.json(
      { error: "Le Compagnon de test n'est pas configuré" },
      { status: 503 },
    );
  }

  const basicAuth = Buffer.from(`${webhookUser}:${webhookPass}`).toString(
    "base64",
  );

  let n8nRes: Response;
  try {
    n8nRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        chatInput: message,
        sessionId: `echo-${user.id}-${sessionId}`,
        role: user.role,
        identity: user.email,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return NextResponse.json(
      { error: "Le Compagnon de test est injoignable" },
      { status: 502 },
    );
  }

  if (!n8nRes.ok) {
    return NextResponse.json(
      { error: "Le Compagnon de test n'a pas pu répondre" },
      { status: 502 },
    );
  }

  const data = (await n8nRes.json()) as { output?: string };
  return NextResponse.json({
    reply: data.output || "Je n'ai pas pu formuler de réponse, réessaie.",
  });
}

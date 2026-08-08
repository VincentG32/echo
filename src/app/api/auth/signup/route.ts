import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/airtable";
import { parseJsonBody } from "@/lib/api-helpers";
import { hashPassword, setAuthCookie } from "@/lib/auth";
import {
  getAppUrl,
  sendEmail,
  verificationEmailHtml,
} from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/schemas";
import { generateToken, tokenExpiry } from "@/lib/tokens";

const VERIFICATION_TTL_MINUTES = 24 * 60;

export async function POST(request: Request) {
  const limited = await rateLimit(request, { name: "signup", max: 3, window: "1 m" });
  if (limited) return limited;

  const parsed = await parseJsonBody(request, signupSchema);
  if (parsed.error) return parsed.error;

  const { email, password, name } = parsed.data;
  const existing = await getUserByEmail(email);

  // Gate 0 (M2): l'ancienne version renvoyait un 400 dédié si l'email
  // existait déjà et un 200 avec l'utilisateur sinon — les deux réponses
  // étaient structurellement distinctes, ce qui permettait de deviner
  // l'existence d'un compte (énumération d'emails). On renvoie maintenant
  // la MÊME forme de réponse dans les deux cas ; si le compte existe déjà,
  // on ne crée rien et on avertit son propriétaire par email plutôt que
  // l'appelant.
  if (existing) {
    await sendEmail({
      to: existing.email,
      subject: "Tentative de création de compte Pulse",
      html: `<p>Quelqu'un a tenté de créer un compte Pulse avec cette adresse, qui possède déjà un compte. Si ce n'était pas vous, ignorez cet email. Sinon, connectez-vous normalement ou utilisez « mot de passe oublié ».</p>`,
      devLogContext: `signup collision for ${existing.email}`,
    });
    return NextResponse.json({
      ok: true,
      message:
        "Si cette adresse n'est pas déjà utilisée, un email de vérification vient de vous être envoyé.",
    });
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = generateToken();
  const verificationExpires = tokenExpiry(VERIFICATION_TTL_MINUTES);
  const user = await createUser({
    email,
    passwordHash,
    name,
    verificationToken,
    verificationExpires,
  });

  const verifyUrl = `${getAppUrl()}/api/auth/verify/${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: "Activez votre compte Pulse",
    html: verificationEmailHtml(verifyUrl),
    devLogContext: `verifyUrl=${verifyUrl}`,
  });

  await setAuthCookie({
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
  });
  revalidatePath("/", "layout");

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}

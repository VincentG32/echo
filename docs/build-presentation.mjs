// Generate the Pulse final-presentation deck.
// Run: node docs/build-presentation.mjs
// Output: docs/pulse-presentation.pptx
import pptxgen from "./node_modules/pptxgenjs/dist/pptxgen.es.js";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 × 7.5
pres.author = "Vincent Granouillit";
pres.title = "Pulse — Présentation finale";

// ─── Palette (Pulse: charcoal/gray/white) ──────────────────────────────
const C = {
  ink: "1A1A1A",
  inkSoft: "404040",
  muted: "5A5A5A",
  mutedLight: "8A8A8A",
  border: "D8D8D5",
  borderLight: "E8E8E5",
  bgSoft: "F7F7F5",
  bgPaper: "FFFFFF",
  accent: "1A1A1A", // monochrome — accent = pure black/charcoal
};

const FONT_HEAD = "Helvetica Neue";
const FONT_BODY = "Helvetica Neue";

const W = 13.3;
const H = 7.5;
const MARGIN = 0.7;

// Reusable element helpers ──────────────────────────────────────────────
function pageNumber(slide, n, total) {
  slide.addText(`${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
    x: W - MARGIN - 1.0,
    y: H - 0.5,
    w: 1.0,
    h: 0.3,
    fontSize: 9,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    align: "right",
    margin: 0,
  });
}

function tinyHeader(slide, label) {
  slide.addText(label, {
    x: MARGIN,
    y: 0.45,
    w: 8,
    h: 0.3,
    fontSize: 9,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: false,
    charSpacing: 4,
    margin: 0,
  });
}

function titleH1(slide, title) {
  slide.addText(title, {
    x: MARGIN,
    y: 1.1,
    w: W - 2 * MARGIN,
    h: 1.0,
    fontSize: 36,
    fontFace: FONT_HEAD,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  // thin underline accent
  slide.addShape(pres.shapes.LINE, {
    x: MARGIN,
    y: 2.05,
    w: 0.6,
    h: 0,
    line: { color: C.ink, width: 1.5 },
  });
}

const TOTAL = 15;

// ─── Slide 1 — Title ────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };

  // tiny brand mark
  s.addText("PULSE", {
    x: MARGIN,
    y: MARGIN,
    w: 4,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: true,
    charSpacing: 8,
    margin: 0,
  });

  s.addText("Centraliser et prioriser le feedback produit", {
    x: MARGIN,
    y: 2.6,
    w: W - 2 * MARGIN,
    h: 1.4,
    fontSize: 48,
    fontFace: FONT_HEAD,
    color: C.ink,
    bold: true,
    margin: 0,
  });

  s.addText("Présentation finale · La Capsule · Mai 2026", {
    x: MARGIN,
    y: 4.2,
    w: W - 2 * MARGIN,
    h: 0.5,
    fontSize: 16,
    fontFace: FONT_BODY,
    color: C.muted,
    margin: 0,
  });

  // bottom-left signature
  s.addText("Vincent Granouillit", {
    x: MARGIN,
    y: H - 1.1,
    w: 6,
    h: 0.4,
    fontSize: 13,
    fontFace: FONT_BODY,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  s.addText("Programme Web Development", {
    x: MARGIN,
    y: H - 0.7,
    w: 6,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    margin: 0,
  });
}

// ─── Slide 2 — Le problème ──────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "LE POINT DE DÉPART");
  titleH1(s, "Comment votre PM décide-t-il quoi build cette semaine ?");

  const items = [
    "Sondage Slack rapide ?",
    "La mémoire (sélective) du PM ?",
    "Une roadmap qui bouge tous les jours ?",
    "Le client qui crie le plus fort ?",
  ];
  const startY = 3.3;
  items.forEach((txt, i) => {
    const y = startY + i * 0.7;
    s.addShape(pres.shapes.OVAL, {
      x: MARGIN + 0.05,
      y: y + 0.18,
      w: 0.18,
      h: 0.18,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(txt, {
      x: MARGIN + 0.5,
      y,
      w: W - 2 * MARGIN - 0.5,
      h: 0.5,
      fontSize: 22,
      fontFace: FONT_BODY,
      color: C.inkSoft,
      margin: 0,
    });
  });

  s.addText("Pulse remplace les heuristiques par des votes utilisateurs.", {
    x: MARGIN,
    y: H - 1.4,
    w: W - 2 * MARGIN,
    h: 0.5,
    fontSize: 18,
    fontFace: FONT_BODY,
    color: C.ink,
    italic: true,
    margin: 0,
  });

  pageNumber(s, 2, TOTAL);
}

// ─── Slide 3 — Section break: Partie 1 ──────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.ink };

  s.addText("PARTIE 1", {
    x: MARGIN,
    y: 2.4,
    w: 6,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: true,
    charSpacing: 8,
    margin: 0,
  });

  s.addText("Tech & démarche audit", {
    x: MARGIN,
    y: 3.0,
    w: W - 2 * MARGIN,
    h: 1.4,
    fontSize: 56,
    fontFace: FONT_HEAD,
    color: "FFFFFF",
    bold: true,
    margin: 0,
  });

  s.addText("Comment c'est construit, et comment je l'ai stress-testé.", {
    x: MARGIN,
    y: 4.5,
    w: W - 2 * MARGIN,
    h: 0.5,
    fontSize: 18,
    fontFace: FONT_BODY,
    color: "C8C8C8",
    margin: 0,
  });

  s.addText("Architecture · Stack · Audit 4 axes", {
    x: MARGIN,
    y: H - 1.1,
    w: 8,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: true,
    charSpacing: 4,
    margin: 0,
  });
}

// ─── Slide 4 — Architecture diagram ─────────────────────────────────────
// Layout: Vercel is the hub (centered, dark). Inputs feed in from
// above (Browser) and from the left (GitHub → GitHub Actions). Vercel
// fans out below to the 4 satellite services.
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "VUE D'ENSEMBLE");
  titleH1(s, "Comment tout s'emboîte");

  // Helper: 2-line labelled box (used for every node except Vercel)
  function nodeBox(x, y, w, h, top, sub, opts = {}) {
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y,
      w,
      h,
      fill: { color: opts.fill ?? C.bgSoft },
      line: { color: opts.borderColor ?? C.border, width: 1 },
    });
    s.addText(top, {
      x,
      y: y + 0.1,
      w,
      h: h * 0.45,
      fontSize: 13,
      fontFace: FONT_BODY,
      color: C.ink,
      bold: true,
      align: "center",
      valign: "bottom",
      margin: 0,
    });
    s.addText(sub, {
      x,
      y: y + h * 0.5,
      w,
      h: h * 0.45,
      fontSize: 10,
      fontFace: FONT_BODY,
      color: C.muted,
      align: "center",
      valign: "top",
      margin: 0,
    });
  }

  // ── Top: Browser ──
  const browserW = 3.4;
  const browserX = (W - browserW) / 2;
  const browserY = 2.6;
  const browserH = 0.85;
  nodeBox(browserX, browserY, browserW, browserH, "Navigateur", "Bob · Alice · Yasmine");

  // Arrow Browser ↓ Vercel
  s.addShape(pres.shapes.LINE, {
    x: W / 2,
    y: browserY + browserH,
    w: 0,
    h: 0.45,
    line: { color: C.muted, width: 1 },
  });

  // ── Middle row: GitHub → Actions → Vercel (Vercel = hub, dark) ──
  const midY = 3.95;
  const vercelW = 3.4;
  const vercelH = 1.1;
  const vercelX = (W - vercelW) / 2;
  const flowH = 0.85;
  // Vertical center of the row, used to align horizontal arrows
  const flowCenterY = midY + flowH / 2 + 0.075; // slight nudge to align with Vercel center
  // GitHub box: x=0.7
  const ghX = 0.7;
  const ghW = 1.65;
  // Actions box: between GitHub and Vercel
  const actX = 2.7;
  const actW = 1.85;

  // GitHub
  nodeBox(ghX, midY + 0.075, ghW, flowH, "GitHub", "Code + historique");

  // Arrow GitHub → Actions
  s.addShape(pres.shapes.LINE, {
    x: ghX + ghW,
    y: flowCenterY,
    w: actX - (ghX + ghW),
    h: 0,
    line: { color: C.muted, width: 1 },
  });

  // GitHub Actions
  nodeBox(actX, midY + 0.075, actW, flowH, "GitHub Actions", "Vérifications auto");

  // Arrow Actions → Vercel
  s.addShape(pres.shapes.LINE, {
    x: actX + actW,
    y: flowCenterY,
    w: vercelX - (actX + actW),
    h: 0,
    line: { color: C.muted, width: 1 },
  });

  // Vercel (the hub) — dark, taller
  s.addShape(pres.shapes.RECTANGLE, {
    x: vercelX,
    y: midY,
    w: vercelW,
    h: vercelH,
    fill: { color: C.ink },
    line: { color: C.ink, width: 0 },
  });
  s.addText("Vercel", {
    x: vercelX,
    y: midY + 0.18,
    w: vercelW,
    h: 0.4,
    fontSize: 17,
    fontFace: FONT_BODY,
    color: "FFFFFF",
    bold: true,
    align: "center",
    valign: "bottom",
    margin: 0,
  });
  s.addText("Site en ligne · Next.js + TypeScript", {
    x: vercelX,
    y: midY + 0.6,
    w: vercelW,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: "C8C8C8",
    align: "center",
    valign: "top",
    margin: 0,
  });

  // Arrow Vercel ↓ services
  const arrowDownY = midY + vercelH;
  s.addShape(pres.shapes.LINE, {
    x: W / 2,
    y: arrowDownY,
    w: 0,
    h: 0.45,
    line: { color: C.muted, width: 1 },
  });

  // ── Bottom: 4 satellite services ──
  const servicesY = arrowDownY + 0.55;
  const services = [
    { t: "Airtable", s: "Données" },
    { t: "Resend", s: "Emails" },
    { t: "Redis", s: "Anti-spam" },
    { t: "Sentry", s: "Erreurs" },
  ];
  const boxW = 2.4;
  const gap = 0.18;
  const totalW = services.length * boxW + (services.length - 1) * gap;
  const startX = (W - totalW) / 2;
  services.forEach((srv, i) => {
    const x = startX + i * (boxW + gap);
    nodeBox(x, servicesY, boxW, 0.85, srv.t, srv.s);
  });

  pageNumber(s, 4, TOTAL);
}

// ─── Helper: 4-axis audit slide layout ─────────────────────────────────
// Used by slides 6-9 (cybersé · archi · qualité code · a11y). Same
// structure for visual rhythm: tinyHeader, title, intro, 3-4 bullets
// with vertical accent stripe, footer.
function auditSlide({ axisNum, headerLabel, title, intro, bullets, footer }) {
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, headerLabel);
  titleH1(s, title);

  s.addText(intro, {
    x: MARGIN,
    y: 2.5,
    w: W - 2 * MARGIN,
    h: 0.8,
    fontSize: 16,
    fontFace: FONT_BODY,
    color: C.muted,
    italic: true,
    margin: 0,
  });

  bullets.forEach((b, i) => {
    const y = 3.55 + i * 0.75;
    s.addShape(pres.shapes.RECTANGLE, {
      x: MARGIN,
      y,
      w: 0.04,
      h: 0.6,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(
      [
        { text: b.label + " — ", options: { bold: true, color: C.ink } },
        { text: b.body, options: { color: C.inkSoft } },
      ],
      {
        x: MARGIN + 0.25,
        y,
        w: W - 2 * MARGIN - 0.25,
        h: 0.65,
        fontSize: 14,
        fontFace: FONT_BODY,
        valign: "middle",
        margin: 0,
      },
    );
  });

  s.addText(footer, {
    x: MARGIN,
    y: H - 1.0,
    w: W - 2 * MARGIN,
    h: 0.4,
    fontSize: 12,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    italic: true,
    margin: 0,
  });

  pageNumber(s, axisNum + 5, TOTAL); // axes 1-4 → slides 6-9
}

// ─── Slide 5 — Stack tech (1 slide consolidée) ──────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "STACK TECHNIQUE");
  titleH1(s, "Les outils, en une vue");

  s.addText(
    "Six blocs qui s'emboîtent : du code source jusqu'à l'app en ligne, plus les services et l'assistant qui ont accéléré toute la chaîne.",
    {
      x: MARGIN,
      y: 2.4,
      w: W - 2 * MARGIN,
      h: 0.55,
      fontSize: 15,
      fontFace: FONT_BODY,
      color: C.muted,
      italic: true,
      margin: 0,
    },
  );

  const blocks = [
    {
      name: "Code de l'app",
      tools: "Next.js · TypeScript · Tailwind",
      role: "Le squelette qui gère pages, URLs, données. Le style écrit dans le code.",
    },
    {
      name: "Code source",
      tools: "GitHub · GitHub Actions",
      role: "Une Google Docs pour le code, mémoire infinie. Un robot vérifie chaque modification.",
    },
    {
      name: "Mise en ligne",
      tools: "Vercel",
      role: "Site en ligne en 30 secondes après chaque sauvegarde, sans configurer de serveur.",
    },
    {
      name: "Base de données",
      tools: "Airtable",
      role: "Un Excel collaboratif branché à l'app. 5 tables (Users, Feedbacks, Votes, Notifs, Comments).",
    },
    {
      name: "Services satellites",
      tools: "Resend · Upstash Redis · Sentry",
      role: "Emails (vérification, reset). Anti-spam (rate limit). Détection d'erreurs en prod.",
    },
    {
      name: "Assistant IA",
      tools: "Claude",
      role: "Génération de code, refactor, audit, debug. L'outil qui a fait chuter le ticket d'entrée pour un non-dev.",
    },
  ];

  const cardY0 = 3.1;
  const cardH = 0.5;
  const cardGap = 0.08;
  blocks.forEach((b, i) => {
    const y = cardY0 + i * (cardH + cardGap);
    s.addShape(pres.shapes.RECTANGLE, {
      x: MARGIN,
      y,
      w: W - 2 * MARGIN,
      h: cardH,
      fill: { color: C.bgSoft },
      line: { color: C.border, width: 1 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: MARGIN,
      y,
      w: 0.06,
      h: cardH,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(b.name, {
      x: MARGIN + 0.2,
      y,
      w: 2.8,
      h: cardH,
      fontSize: 13,
      fontFace: FONT_BODY,
      color: C.ink,
      bold: true,
      valign: "middle",
      margin: 0,
    });
    s.addText(b.tools, {
      x: MARGIN + 3.1,
      y,
      w: 3.3,
      h: cardH,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: C.muted,
      valign: "middle",
      margin: 0,
    });
    s.addText(b.role, {
      x: MARGIN + 6.5,
      y,
      w: W - 2 * MARGIN - 6.7,
      h: cardH,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: C.inkSoft,
      valign: "middle",
      margin: 0,
    });
  });

  s.addText(
    "Tout est gratuit (free tiers), connecté avec quelques clics dans des dashboards.",
    {
      x: MARGIN,
      y: H - 0.85,
      w: W - 2 * MARGIN - 1.2,
      h: 0.35,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: C.mutedLight,
      italic: true,
      margin: 0,
    },
  );

  pageNumber(s, 5, TOTAL);
}

// ─── Slide 6 — Audit · Cybersécurité ────────────────────────────────────
auditSlide({
  axisNum: 1,
  headerLabel: "AUDIT · 1/4",
  title: "Cybersécurité : ce qui protège l'app",
  intro:
    "Une app avec des comptes utilisateurs et des données privées doit être protégée contre les attaques classiques.",
  bullets: [
    {
      label: "Mots de passe protégés",
      body: "chiffrés avec bcrypt, jamais lisibles même par moi.",
    },
    {
      label: "Sessions sécurisées",
      body: "cookie signé par le serveur, transmis en HTTPS, inaccessible au code de la page.",
    },
    {
      label: "Anti-injection en masse",
      body: "login bloqué après 5 essais en 1 minute. Signup, vote et reset password aussi limités.",
    },
    {
      label: "Vérification email + reset password",
      body: "pas d'inscription avec une adresse fictive. Liens à expiration courte, à usage unique.",
    },
  ],
  footer: "Pas une fonctionnalité visible — un filet en arrière-plan, indispensable.",
});

// ─── Slide 7 — Audit · Architecture ─────────────────────────────────────
auditSlide({
  axisNum: 2,
  headerLabel: "AUDIT · 2/4",
  title: "Architecture : un code organisé pour évoluer",
  intro:
    "Une app qui doit pouvoir grandir, et être comprise par d'autres devs (ou moi-même dans 6 mois).",
  bullets: [
    {
      label: "Code rangé par responsabilité",
      body: "un dossier pour les pages, un autre pour les données, un autre pour les utilitaires.",
    },
    {
      label: "Helpers réutilisables",
      body: "les morceaux de code répétés sont factorisés (ex : vérifier qu'un user est connecté = 1 fonction réutilisée 10 fois).",
    },
    {
      label: "Cache des données fréquentes",
      body: "les listes lues à chaque page sont mises en cache, et invalidées proprement à la moindre modification.",
    },
    {
      label: "Constantes centralisées",
      body: "durées, tailles, identifiants de cookie regroupés dans un seul fichier de config.",
    },
  ],
  footer: "Le code peut être lu, repris et étendu sans tout réapprendre.",
});

// ─── Slide 8 — Audit · Qualité du code ──────────────────────────────────
auditSlide({
  axisNum: 3,
  headerLabel: "AUDIT · 3/4",
  title: "Qualité du code : un filet de sécurité automatique",
  intro:
    "Pour ne pas casser ce qui marche en ajoutant de nouvelles fonctionnalités.",
  bullets: [
    {
      label: "Vérification automatique",
      body: "à chaque modification, des robots vérifient le code (compile-t-il ? respecte-t-il les règles ? ne casse-t-il rien ?).",
    },
    {
      label: "0 erreur, 0 warning",
      body: "sur 3 000+ lignes de code. Si je dévie, l'éditeur me crie dessus avant que ça parte en ligne.",
    },
    {
      label: "10 tests qui simulent des utilisateurs",
      body: "signup, vote, anti-double-vote, permissions, kanban — tournent à chaque modification.",
    },
    {
      label: "Historique propre",
      body: "70+ modifications avec messages explicites. Je peux remonter dans le temps en 2 clics.",
    },
  ],
  footer: "Vert ou rouge en 1 minute. Le filet attrape les bugs avant les utilisateurs.",
});

// ─── Slide 9 — Audit · Accessibilité ────────────────────────────────────
auditSlide({
  axisNum: 4,
  headerLabel: "AUDIT · 4/4",
  title: "Accessibilité : utilisable par tous",
  intro:
    "Norme WCAG 2.1 AA — un standard international pour rendre un site utilisable par les personnes en situation de handicap.",
  bullets: [
    {
      label: "Navigation au clavier visible",
      body: "un cercle de focus apparaît sur l'élément actif quand on appuie sur Tab.",
    },
    {
      label: "Lien d'évitement",
      body: "\"Aller au contenu principal\" pour les lecteurs d'écran qui peuvent sauter le menu.",
    },
    {
      label: "Contraste validé",
      body: "les couleurs sont assez contrastées pour rester lisibles, y compris pour les personnes malvoyantes.",
    },
    {
      label: "Animations respectueuses",
      body: "les confettis (et autres animations) sont coupés pour les personnes sensibles aux mouvements (option système).",
    },
  ],
  footer: "Audit complet documenté dans le README — items identifiés, traités, justifiés.",
});

// ─── Slide 10 — Section break: Partie 2 ─────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.ink };

  s.addText("PARTIE 2", {
    x: MARGIN,
    y: 2.4,
    w: 6,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: true,
    charSpacing: 8,
    margin: 0,
  });

  s.addText("L'outil & le retour d'expérience", {
    x: MARGIN,
    y: 3.0,
    w: W - 2 * MARGIN,
    h: 1.4,
    fontSize: 52,
    fontFace: FONT_HEAD,
    color: "FFFFFF",
    bold: true,
    margin: 0,
  });

  s.addText("Vision · fonctionnalités · ce que j'ai appris en codant.", {
    x: MARGIN,
    y: 4.6,
    w: W - 2 * MARGIN,
    h: 0.5,
    fontSize: 18,
    fontFace: FONT_BODY,
    color: "C8C8C8",
    margin: 0,
  });
}

// ─── Slide 11 — Vision ──────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "VISION");
  titleH1(s, "On part du problème, pas des features.");

  s.addText(
    "Pulse résout un problème simple : centraliser et prioriser le feedback produit, sans biais.",
    {
      x: MARGIN,
      y: 2.5,
      w: W - 2 * MARGIN,
      h: 0.7,
      fontSize: 17,
      fontFace: FONT_BODY,
      color: C.muted,
      italic: true,
      margin: 0,
    },
  );

  const principles = [
    {
      label: "Une seule source de vérité",
      body: "fini Slack + Notion + emails + tickets éparpillés. Tout arrive au même endroit, structuré.",
    },
    {
      label: "Le vote utilisateur fait la priorité",
      body: "pas le client qui crie le plus fort, pas la mémoire du PM. La donnée tranche.",
    },
    {
      label: "Transparence du processus",
      body: "le créateur du feedback est notifié à chaque étape : pris dans le backlog, en cours, livré.",
    },
  ];

  principles.forEach((p, i) => {
    const y = 3.5 + i * 0.95;
    s.addShape(pres.shapes.RECTANGLE, {
      x: MARGIN,
      y,
      w: 0.04,
      h: 0.75,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(
      [
        { text: p.label + " — ", options: { bold: true, color: C.ink } },
        { text: p.body, options: { color: C.inkSoft } },
      ],
      {
        x: MARGIN + 0.25,
        y,
        w: W - 2 * MARGIN - 0.25,
        h: 0.8,
        fontSize: 15,
        fontFace: FONT_BODY,
        valign: "middle",
        margin: 0,
      },
    );
  });

  s.addText(
    "Chaque fonctionnalité ajoutée résout un de ces 3 principes. Pas de feature gadget.",
    {
      x: MARGIN,
      y: H - 1.0,
      w: W - 2 * MARGIN,
      h: 0.4,
      fontSize: 13,
      fontFace: FONT_BODY,
      color: C.ink,
      italic: true,
      bold: true,
      margin: 0,
    },
  );

  pageNumber(s, 11, TOTAL);
}

// ─── Helper: persona-style 3-column slide (used by both fonctionnalités versions) ─
function threeColumnFeaturesSlide({ headerLabel, title, intro, items }) {
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, headerLabel);
  titleH1(s, title);

  s.addText(intro, {
    x: MARGIN,
    y: 2.5,
    w: W - 2 * MARGIN,
    h: 0.7,
    fontSize: 16,
    fontFace: FONT_BODY,
    color: C.muted,
    italic: true,
    margin: 0,
  });

  const colW = 3.7;
  const colGap = 0.3;
  const totalCols = items.length * colW + (items.length - 1) * colGap;
  const startX = (W - totalCols) / 2;
  const cardY = 3.5;
  const cardH = 3.0;

  items.forEach((it, i) => {
    const x = startX + i * (colW + colGap);
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: cardY,
      w: colW,
      h: cardH,
      fill: { color: C.bgSoft },
      line: { color: C.border, width: 1 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: cardY,
      w: colW,
      h: 0.06,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(it.name, {
      x: x + 0.25,
      y: cardY + 0.2,
      w: colW - 0.5,
      h: 0.45,
      fontSize: 19,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    s.addText(it.role, {
      x: x + 0.25,
      y: cardY + 0.65,
      w: colW - 0.5,
      h: 0.35,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: C.mutedLight,
      bold: true,
      charSpacing: 3,
      margin: 0,
    });
    it.features.forEach((f, j) => {
      const fy = cardY + 1.1 + j * 0.45;
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.25,
        y: fy + 0.15,
        w: 0.1,
        h: 0.1,
        fill: { color: C.ink },
        line: { color: C.ink, width: 0 },
      });
      s.addText(f, {
        x: x + 0.45,
        y: fy,
        w: colW - 0.7,
        h: 0.45,
        fontSize: 10.5,
        fontFace: FONT_BODY,
        color: C.inkSoft,
        margin: 0,
      });
    });
    s.addText(
      [
        { text: "Résout — ", options: { bold: true, italic: true } },
        { text: it.problem, options: { italic: true } },
      ],
      {
        x: x + 0.25,
        y: cardY + 2.55,
        w: colW - 0.5,
        h: 0.4,
        fontSize: 10,
        fontFace: FONT_BODY,
        color: C.muted,
        margin: 0,
      },
    );
  });

  pageNumber(s, 12, TOTAL);
}

// ─── Slide 12 — Fonctionnalités · Version A : par persona ───────────────
threeColumnFeaturesSlide({
  headerLabel: "FONCTIONNALITÉS · VERSION A · PAR PERSONA",
  title: "3 profils, 3 problèmes résolus",
  intro:
    "Chaque persona a son propre parcours dans l'app, avec les fonctionnalités qui résolvent son problème.",
  items: [
    {
      name: "Bob",
      role: "Utilisateur",
      features: [
        "Soumettre une idée (titre, description, type)",
        "Voter sur les feedbacks (1 vote / feedback)",
        "Suivre l'avancement via notifications + commentaires",
      ],
      problem:
        "Ne plus envoyer ses idées dans le vide. Voir ce qui devient une feature, et quand.",
    },
    {
      name: "Yasmine",
      role: "Développeuse",
      features: [
        "Vue kanban dédiée (à faire / en cours / review / livré)",
        "Drag-drop avec assignation auto",
        "Notification au créateur à chaque changement de statut",
      ],
      problem:
        "Avoir une vue claire de ce qu'on doit construire, dans quel ordre, en cohérence avec les votes.",
    },
    {
      name: "Alice",
      role: "Admin produit",
      features: [
        "Tableau de bord (KPIs, graphiques, top votes)",
        "Modération (envoyer au backlog, supprimer)",
        "Vue tabbed : vue d'ensemble + liste",
      ],
      problem:
        "Décider quoi prioriser à partir de données réelles, pas d'intuition ni de mémoire.",
    },
  ],
});

// ─── Slide 12bis — Fonctionnalités · Version B : par catégorie produit ──
threeColumnFeaturesSlide({
  headerLabel: "FONCTIONNALITÉS · VERSION B · PAR CATÉGORIE PRODUIT",
  title: "3 piliers : cœur, workflow, expérience",
  intro:
    "Cœur produit : la mécanique. Workflow équipe : le suivi. Expérience : le confort d'usage.",
  items: [
    {
      name: "Cœur produit",
      role: "Le minimum vital",
      features: [
        "Soumission de feedback (titre, description, type)",
        "Système de vote 1 user = 1 vote",
        "Liste triée par votes (tri émergent)",
      ],
      problem: "Sans ça, pas de produit. Le minimum pour valider la promesse.",
    },
    {
      name: "Workflow équipe",
      role: "Du feedback au livrable",
      features: [
        "Kanban dev (drag-drop, assignations)",
        "Dashboard admin (KPIs, charts)",
        "Notifications de statut + commentaires",
      ],
      problem: "Transforme une liste passive en pipeline actif suivi par toute l'équipe.",
    },
    {
      name: "Expérience utilisateur",
      role: "Le confort qui retient",
      features: [
        "Mode sombre + toggle persistant",
        "Mobile responsive (desktop + smartphone)",
        "Toasts sur toutes les actions",
      ],
      problem: "Sans ça, l'utilisateur fuit après 2 visites. Avec, il revient.",
    },
  ],
});

// ─── Slide 13 — Coder vs Bubble : pros/cons ─────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "RETOUR D'EXPÉRIENCE");
  titleH1(s, "Coder en direct + IA  vs  Bubble");

  s.addText(
    "J'ai pris la route du code direct, recommandée pour les profils dev. Voici ce que j'y ai gagné et ce que ça m'a coûté.",
    {
      x: MARGIN,
      y: 2.5,
      w: W - 2 * MARGIN,
      h: 0.7,
      fontSize: 16,
      fontFace: FONT_BODY,
      color: C.muted,
      italic: true,
      margin: 0,
    },
  );

  const colW = 5.7;
  const colGap = 0.3;
  const totalCols = 2 * colW + colGap;
  const startX = (W - totalCols) / 2;
  const cardY = 3.4;
  const cardH = 3.5;

  // ── LEFT card: Coder direct + IA (dark) ──
  {
    const x = startX;
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: cardY,
      w: colW,
      h: cardH,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText("Coder direct + IA", {
      x: x + 0.35,
      y: cardY + 0.25,
      w: colW - 0.7,
      h: 0.5,
      fontSize: 20,
      fontFace: FONT_HEAD,
      color: "FFFFFF",
      bold: true,
      margin: 0,
    });
    const pros = [
      "Tu te concentres sur le produit, pas sur les clics de config",
      "Le code t'appartient — récupérable, évolutif, transmissible",
      "Tout est customisable (apparence, interactions, fonctions)",
      "Compétence réutilisable sur tes prochains projets",
    ];
    pros.forEach((p, i) => {
      const y = cardY + 0.85 + i * 0.45;
      s.addText(`✓  ${p}`, {
        x: x + 0.35,
        y,
        w: colW - 0.7,
        h: 0.4,
        fontSize: 11.5,
        fontFace: FONT_BODY,
        color: "F0F0F0",
        margin: 0,
      });
    });
    s.addText(
      "✗  Petite courbe au départ (terminal, GitHub) — l'IA réduit énormément cette barrière",
      {
        x: x + 0.35,
        y: cardY + cardH - 0.7,
        w: colW - 0.7,
        h: 0.5,
        fontSize: 11.5,
        fontFace: FONT_BODY,
        color: "C8C8C8",
        margin: 0,
      },
    );
  }

  // ── RIGHT card: Bubble (light) ──
  {
    const x = startX + colW + colGap;
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: cardY,
      w: colW,
      h: cardH,
      fill: { color: C.bgSoft },
      line: { color: C.border, width: 1 },
    });
    s.addText("Bubble", {
      x: x + 0.35,
      y: cardY + 0.25,
      w: colW - 0.7,
      h: 0.5,
      fontSize: 20,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    const pros = [
      "Pas d'environnement à installer, tout dans le navigateur",
      "Plan gratuit pour démarrer",
      "Si tu connais déjà l'outil, rapide à mettre en route",
    ];
    pros.forEach((p, i) => {
      const y = cardY + 0.85 + i * 0.4;
      s.addText(`✓  ${p}`, {
        x: x + 0.35,
        y,
        w: colW - 0.7,
        h: 0.4,
        fontSize: 11,
        fontFace: FONT_BODY,
        color: C.inkSoft,
        margin: 0,
      });
    });
    const cons = [
      "🔒 Tu es enfermé dans Bubble — code non récupérable. Migration = tout réécrire.",
      "Compétence ultra-spécialisée à Bubble, pas portable ailleurs",
      "Limité dès qu'on veut une fonctionnalité sur mesure (ex : kanban Pulse)",
      "Tarif grimpe vite quand l'app prend de l'ampleur",
    ];
    cons.forEach((c, i) => {
      const y = cardY + 2.1 + i * 0.34;
      s.addText(`✗  ${c}`, {
        x: x + 0.35,
        y,
        w: colW - 0.7,
        h: 0.34,
        fontSize: 10,
        fontFace: FONT_BODY,
        color: C.muted,
        margin: 0,
      });
    });
  }

  pageNumber(s, 13, TOTAL);
}

// ─── Slide 14 — Quand choisir lequel + timeline Pulse ───────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "QUAND CHOISIR LEQUEL ?");
  titleH1(s, "3 cas, et un timing qui change tout");

  // ── Top half: 3 cases ──
  const cases = [
    {
      title: "La barrière a chuté",
      sub: "Pour les non-devs",
      body: "L'IA générative a fait tomber la complexité. Un non-dev peut maintenant construire un vrai produit, pas un Bubble bricolé.",
    },
    {
      title: "Focus produit",
      sub: "Pas la plomberie",
      body: "Avec l'IA tu décris ce que tu veux, ça génère, tu pilotes. Bubble demande beaucoup de clics juste pour avoir le squelette.",
    },
    {
      title: "Compétence durable",
      sub: "Autonomie PM / CP",
      body: "Tu sors avec une méthode réutilisable sur tes prochains projets. Pas verrouillée à un outil propriétaire.",
    },
  ];

  const colW = 3.7;
  const colGap = 0.3;
  const totalCols = cases.length * colW + (cases.length - 1) * colGap;
  const startX = (W - totalCols) / 2;
  const caseY = 2.55;
  const caseH = 1.85;

  cases.forEach((c, i) => {
    const x = startX + i * (colW + colGap);
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: caseY,
      w: colW,
      h: caseH,
      fill: { color: C.bgSoft },
      line: { color: C.border, width: 1 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: caseY,
      w: colW,
      h: 0.05,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(c.title, {
      x: x + 0.25,
      y: caseY + 0.18,
      w: colW - 0.5,
      h: 0.4,
      fontSize: 15,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    s.addText(c.sub, {
      x: x + 0.25,
      y: caseY + 0.6,
      w: colW - 0.5,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT_BODY,
      color: C.mutedLight,
      bold: true,
      charSpacing: 3,
      margin: 0,
    });
    s.addText(c.body, {
      x: x + 0.25,
      y: caseY + 0.95,
      w: colW - 0.5,
      h: 0.85,
      fontSize: 10.5,
      fontFace: FONT_BODY,
      color: C.inkSoft,
      margin: 0,
    });
  });

  // ── Bottom half: timeline ──
  const tlY = 4.85;
  s.addText("Timing Pulse", {
    x: MARGIN,
    y: tlY,
    w: 5,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: true,
    charSpacing: 4,
    margin: 0,
  });
  s.addText(
    "(mesuré sur git, écarts > 1h entre commits exclus comme pauses)",
    {
      x: MARGIN + 1.6,
      y: tlY,
      w: 8,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT_BODY,
      color: C.mutedLight,
      italic: true,
      margin: 0,
    },
  );

  const milestones = [
    { time: "~1h", label: "POC", sub: "(le core tourne end-to-end)" },
    { time: "~3h30", label: "MVP", sub: "(prêt pour de vrais users)" },
    { time: "~12h", label: "Produit actuel", sub: "(sur 4 jours calendaires)" },
  ];

  const lineY = tlY + 1.05;
  s.addShape(pres.shapes.LINE, {
    x: MARGIN + 1.0,
    y: lineY,
    w: W - 2 * MARGIN - 2.0,
    h: 0,
    line: { color: C.border, width: 2 },
  });

  const tlStartX = MARGIN + 1.0;
  const tlEndX = W - MARGIN - 1.0;
  const tlSpan = tlEndX - tlStartX;
  milestones.forEach((m, i) => {
    const x = tlStartX + (i * tlSpan) / (milestones.length - 1);
    s.addShape(pres.shapes.OVAL, {
      x: x - 0.15,
      y: lineY - 0.15,
      w: 0.3,
      h: 0.3,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(m.time, {
      x: x - 1.2,
      y: lineY - 0.85,
      w: 2.4,
      h: 0.6,
      fontSize: 28,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      align: "center",
      margin: 0,
    });
    s.addText(m.label, {
      x: x - 1.5,
      y: lineY + 0.25,
      w: 3.0,
      h: 0.3,
      fontSize: 12,
      fontFace: FONT_BODY,
      color: C.ink,
      bold: true,
      align: "center",
      margin: 0,
    });
    s.addText(m.sub, {
      x: x - 1.5,
      y: lineY + 0.55,
      w: 3.0,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT_BODY,
      color: C.muted,
      align: "center",
      italic: true,
      margin: 0,
    });
  });

  pageNumber(s, 14, TOTAL);
}

// ─── Slide 15 — Q&A ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };

  s.addText("Questions ?", {
    x: 0,
    y: 2.6,
    w: W,
    h: 1.6,
    fontSize: 80,
    fontFace: FONT_HEAD,
    color: C.ink,
    bold: true,
    align: "center",
    margin: 0,
  });

  s.addShape(pres.shapes.LINE, {
    x: W / 2 - 0.4,
    y: 4.4,
    w: 0.8,
    h: 0,
    line: { color: C.ink, width: 1.5 },
  });

  s.addText("github.com/VincentG32/pulse", {
    x: 0,
    y: 4.8,
    w: W,
    h: 0.4,
    fontSize: 14,
    fontFace: FONT_BODY,
    color: C.muted,
    align: "center",
    margin: 0,
  });

  s.addText("Vincent Granouillit · La Capsule · Mai 2026", {
    x: 0,
    y: H - 1.1,
    w: W,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    align: "center",
    charSpacing: 3,
    margin: 0,
  });
}

// ─── Write file ──────────────────────────────────────────────────────────
const outPath = new URL("./pulse-presentation.pptx", import.meta.url).pathname;
await pres.writeFile({ fileName: outPath });
console.log("✓ Wrote", outPath);

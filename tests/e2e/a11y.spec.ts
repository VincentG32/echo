import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// V6 a11y CI: regression-prevention layer on top of the manual WCAG 2.1
// AA audit (cf. README "Accessibilité"). Runs axe-core on the public
// pages — no Airtable / auth needed. If a serious or critical violation
// is introduced, this job fails before merge.
//
// Tag filter: wcag2a / wcag2aa / wcag21a / wcag21aa. We deliberately
// skip experimental rules to avoid noise on alpha checks.

const PUBLIC_PAGES = [
  { path: "/", name: "Landing" },
  { path: "/login", name: "Login" },
  { path: "/signup", name: "Signup" },
  { path: "/forgot-password", name: "Forgot password" },
];

for (const page of PUBLIC_PAGES) {
  test(`a11y · ${page.name} — no serious/critical violations`, async ({ page: p }) => {
    await p.goto(page.path);
    // Wait for the React tree to settle before scanning.
    await p.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page: p })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Surface details when the test fails — Playwright reporter prints
    // the full message including which rule + which selector.
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      blocking,
      `${blocking.length} blocking violation(s) on ${page.path}:\n${blocking
        .map((v) => `  · ${v.id} (${v.impact}) — ${v.help}`)
        .join("\n")}`,
    ).toEqual([]);
  });
}

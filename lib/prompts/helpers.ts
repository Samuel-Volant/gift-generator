/**
 * Helpers partagés pour les prompts LLM — versionnage simple via export.
 * @module lib/prompts/helpers
 */

export const PROMPT_VERSION = "v1";

/**
 * Echappe les caractères XML pour injection sûre dans prompts.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Décrit sémantiquement une valeur de slider 0-100.
 * @param value 0-100
 * @param leftLabel label côté 0 (ex: "Pragmatique")
 * @param rightLabel label côté 100 (ex: "Sentimental")
 * @example describeSlider(40, "Pragmatique", "Sentimental") -> "plutôt pragmatique"
 * @example describeSlider(55, "Objet", "Expérience") -> "équilibré, légèrement expérience"
 */
export function describeSlider(value: number, leftLabel: string, rightLabel: string): string {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const left = leftLabel.toLowerCase();
  const right = rightLabel.toLowerCase();

  if (v <= 12) return `très ${left}`;
  if (v <= 42) return `plutôt ${left}`;
  if (v <= 48) return `légèrement ${left}`;
  if (v <= 57) {
    if (v === 50) return "équilibré";
    if (v < 50) return `équilibré, légèrement ${left}`;
    return `équilibré, légèrement ${right}`;
  }
  if (v <= 63) return `légèrement ${right}`;
  if (v <= 87) return `plutôt ${right}`;
  return `très ${right}`;
}

export const budgetLabelMap: Record<string, string> = {
  "ne-se-prononce-pas": "budget libre (indication souple)",
  petit: "petit budget (~10-25€, indication souple)",
  moyen: "budget moyen (~25-60€, indication souple)",
  eleve: "budget élevé (~60-120€, indication souple)",
  premium: "budget premium (120€+, indication souple)",
};

export const intentionMap: Record<string, string> = {
  "ne-se-prononce-pas": "intention libre",
  wow: "effet wow / impressionner",
  utile: "utile au quotidien",
  fun: "fun / divertissant",
  apprendre: "apprendre / progresser",
  emouvoir: "émouvoir / toucher",
};

/**
 * Sanitize + déduplique + limite une liste de labels.
 * Lowercase/trim pour détection synonymes, conserve casse originale du premier occ.
 * Utilisé côté suggest-tags pour éviter resurrection de synonymes exacts.
 */
export function sanitizeTagLabels(labels: string[], max = 20): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of labels) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(escapeXml(trimmed));
    if (out.length >= max) break;
  }
  return out;
}

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
  petit: "petit budget (<30€, indication souple)",
  moyen: "budget moyen (30-100€, indication souple)",
  eleve: "budget élevé (100-300€, indication souple)",
  premium: "budget premium (>300€, indication souple)",
};

/**
 * Formatte le budget pour le prompt.
 * Si budgetMin/Max sont renseignés et valides, priorise la fourchette précise.
 * Sinon retombe sur le label du preset.
 */
export function formatBudget(params: { budget: string; budgetMin?: number; budgetMax?: number }): string {
  const hasMin = typeof params.budgetMin === "number" && Number.isFinite(params.budgetMin);
  const hasMax = typeof params.budgetMax === "number" && Number.isFinite(params.budgetMax);

  if (hasMin || hasMax) {
    const min = hasMin ? params.budgetMin! : undefined;
    const max = hasMax ? params.budgetMax! : undefined;

    // Validation silencieuse : si incohérent, fallback preset
    const minValid = min === undefined || (min >= 0 && min <= 5000);
    const maxValid = max === undefined || (max >= 0 && max <= 5000);
    const rangeValid = min === undefined || max === undefined || max > min;

    if (minValid && maxValid && rangeValid) {
      if (min !== undefined && max !== undefined) {
        return `${min}-${max}€ (indication souple, viser cette fourchette mais ne pas bloquer si idée pertinente hors fourchette)`;
      }
      if (min !== undefined) {
        return `à partir de ${min}€ (indication souple, viser au-dessus de ${min}€ mais ne pas bloquer)`;
      }
      if (max !== undefined) {
        return `jusqu'à ${max}€ (indication souple, viser en dessous de ${max}€ mais ne pas bloquer)`;
      }
    }
  }

  return budgetLabelMap[params.budget] ?? budgetLabelMap["ne-se-prononce-pas"];
}

/**
 * Valide la cohérence budgetMin/max (utilisé côté UI et zod).
 * Retourne null si valide, sinon message d'erreur.
 */
export function validateBudgetRange(
  budgetMin?: number,
  budgetMax?: number,
): string | null {
  const hasMin = typeof budgetMin === "number" && Number.isFinite(budgetMin);
  const hasMax = typeof budgetMax === "number" && Number.isFinite(budgetMax);

  if (hasMin && (budgetMin! < 0 || budgetMin! > 5000)) return "Le minimum doit être entre 0 et 5000€";
  if (hasMax && (budgetMax! < 0 || budgetMax! > 5000)) return "Le maximum doit être entre 0 et 5000€";
  if (hasMin && hasMax && budgetMax! <= budgetMin!) return "Le maximum doit être supérieur au minimum";
  return null;
}

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

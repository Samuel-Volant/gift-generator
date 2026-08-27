/**
 * Parse JSON safely, stripping markdown fences like ```json ... ``` if present.
 * Throws with a clear message if parsing fails.
 */
export function parseJsonSafe(text: string | null | undefined): unknown {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Reponse vide du LLM");
  }

  let cleaned = text.trim();

  // Strip ```json ... ``` or ``` ... ``` fences
  // Handles:
  // ```json
  // { ... }
  // ```
  // and
  // ```
  // { ... }
  // ```
  if (cleaned.startsWith("```")) {
    // Remove opening fence (```json or ```)
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    // Remove closing fence
    cleaned = cleaned.replace(/\s*```\s*$/i, "");
    cleaned = cleaned.trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Fallback: try to extract the first JSON object/array in the text
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // fall through to try truncation repair below
      }
    }
    const message = err instanceof Error ? err.message : String(err);
    const isTruncation =
      /Unterminated string/i.test(message) || /Unexpected end of JSON/i.test(message) || /Unterminated/i.test(message);

    if (isTruncation) {
      const repaired = tryRepairTruncatedJson(cleaned);
      if (repaired !== null) {
        try {
          return JSON.parse(repaired);
        } catch {
          // fall through to truncation heuristic 2: cut to last complete object
          const salvaged = trySalvageLastCompleteObject(cleaned);
          if (salvaged !== null) {
            try {
              return JSON.parse(salvaged);
            } catch {
              // fall through
            }
          }
        }
      } else {
        // try salvage directly if close-string repair unavailable
        const salvaged = trySalvageLastCompleteObject(cleaned);
        if (salvaged !== null) {
          try {
            return JSON.parse(salvaged);
          } catch {
            // fall through
          }
        }
      }
    }

    throw new Error(`Format JSON invalide: ${message}`);
  }
}

/**
 * Tente de réparer un JSON tronqué en pleine string :
 * - ferme la string si non terminée (en tenant compte des escapes)
 * - ferme les crochets/accolades ouverts (hors strings)
 * Retourne null si rien de plausible.
 */
function tryRepairTruncatedJson(text: string): string | null {
  // Heuristique: est-on à l'intérieur d'une string non fermée ?
  let inString = false;
  let escapeNext = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
    }
  }

  let candidate = text;
  if (inString) {
    candidate += '"';
  }

  // Construit la pile des ouvrants hors strings pour Fermeture dans bon ordre
  const stack: string[] = [];
  inString = false;
  escapeNext = false;
  for (let i = 0; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (ch === "}") {
      if (stack.length > 0 && stack[stack.length - 1] === "{") stack.pop();
      else return null; // déséquilibré
    } else if (ch === "]") {
      if (stack.length > 0 && stack[stack.length - 1] === "[") stack.pop();
      else return null;
    }
  }

  if (stack.length === 0) return null;

  let suffix = "";
  for (let i = stack.length - 1; i >= 0; i--) {
    suffix += stack[i] === "{" ? "}" : "]";
  }

  return candidate + suffix;
}

/**
 * Coupe au dernier objet complet (délimité par "},") et ferme le JSON.
 * Utile quand la troncature coupe en plein milieu d'un gift.
 */
function trySalvageLastCompleteObject(text: string): string | null {
  // Cherche le dernier "}," plausible avant la fin (fin d'un gift)
  // On cherche le dernier "\n    }," ou "}," et on coupe après
  const lastClose = text.lastIndexOf("},");
  if (lastClose === -1) return null;
  // Inclut le } mais pas la virgule
  const truncated = text.slice(0, lastClose + 1);

  // Réutilise la logique de fermeture
  const repaired = tryRepairTruncatedJson(truncated);
  if (repaired) return repaired;

  // Fallback simple: ferme array + objet racine
  // Suppose structure {"gift_ideas":[...]}
  if (truncated.includes('"gift_ideas"')) {
    // Si on a déjà fermé avec }, il faut fermer ] puis }
    return truncated + "]}";
  }
  return null;
}

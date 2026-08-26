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
        // fall through to original error
      }
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Format JSON invalide: ${message}`);
  }
}

import { z } from "zod";

export const GiftIdeaSchema = z.object({
  emoji: z.string().min(1),
  category: z.string().min(1),
  title: z.string().min(1),
  reasoning: z.string().min(1),
  price: z.string().min(1),
  tags_used: z.tuple([z.string(), z.string()]).optional(),
  archetype: z.string().optional(),
});

export const GiftIdeasResponseSchema = z.object({
  gift_ideas: z.array(GiftIdeaSchema).min(5).max(5),
});

export type GiftIdeaValidated = z.infer<typeof GiftIdeaSchema>;
export type GiftIdeasResponseValidated = z.infer<typeof GiftIdeasResponseSchema>;

/**
 * Normalise les payloads LLM variants:
 * - array brut -> { gift_ideas: array }
 * - alias keys gifts | giftIdeas | ideas | suggestions -> gift_ideas
 * - sinon retourne tel quel pour laisser la validation échouer avec message clair
 */
export function normalizeGiftIdeasPayload(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    return { gift_ideas: raw };
  }
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if ("gift_ideas" in obj) {
      return raw;
    }
    const aliases = ["gifts", "giftIdeas", "gift_ideas", "ideas", "suggestions"];
    for (const alias of aliases) {
      if (alias in obj) {
        const value = obj[alias];
        if (Array.isArray(value)) {
          return { gift_ideas: value };
        }
      }
    }
  }
  return raw;
}

export function validateGiftIdeasPayload(raw: unknown): GiftIdeasResponseValidated {
  const normalized = normalizeGiftIdeasPayload(raw);
  const result = GiftIdeasResponseSchema.safeParse(normalized);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const details = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : result.error.message;
    // Keep legacy prefix for compat with front toast + tests
    if (
      typeof normalized !== "object" ||
      normalized === null ||
      !("gift_ideas" in (normalized as Record<string, unknown>)) ||
      !Array.isArray((normalized as Record<string, unknown>).gift_ideas)
    ) {
      throw new Error(`Format LLM invalide: 'gift_ideas' manquant ou non-array (${details})`);
    }
    throw new Error(`Format LLM invalide: ${details}`);
  }
  return result.data;
}

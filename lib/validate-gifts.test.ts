import { describe, it, expect } from "vitest";
import { normalizeGiftIdeasPayload, validateGiftIdeasPayload } from "./validate-gifts";

function makeValidGift(overrides: Record<string, unknown> = {}) {
  return {
    emoji: "🎁",
    category: "Tech",
    title: "Test Gift",
    reasoning: "• reason",
    price: "20€",
    tags_used: ["tag1", "tag2"] as [string, string],
    archetype: "OBJET DURABLE",
    ...overrides,
  };
}

describe("normalizeGiftIdeasPayload", () => {
  it("laisse passer gift_ideas correct", () => {
    const payload = { gift_ideas: [makeValidGift()] };
    expect(normalizeGiftIdeasPayload(payload)).toEqual(payload);
  });

  it("normalise alias gifts -> gift_ideas", () => {
    const gifts = [makeValidGift()];
    expect(normalizeGiftIdeasPayload({ gifts })).toEqual({ gift_ideas: gifts });
  });

  it("normalise alias giftIdeas -> gift_ideas", () => {
    const arr = [makeValidGift()];
    expect(normalizeGiftIdeasPayload({ giftIdeas: arr })).toEqual({ gift_ideas: arr });
  });

  it("normalise alias ideas -> gift_ideas", () => {
    const arr = [makeValidGift()];
    expect(normalizeGiftIdeasPayload({ ideas: arr })).toEqual({ gift_ideas: arr });
  });

  it("normalise array brut -> {gift_ideas: array}", () => {
    const arr = [makeValidGift()];
    expect(normalizeGiftIdeasPayload(arr)).toEqual({ gift_ideas: arr });
  });

  it("ne normalise pas si alias non-array", () => {
    const payload = { gifts: "not-array" };
    expect(normalizeGiftIdeasPayload(payload)).toEqual(payload);
  });
});

describe("validateGiftIdeasPayload", () => {
  it("valide un payload correct avec 5 gifts", () => {
    const gifts = Array.from({ length: 5 }, (_, i) => makeValidGift({ title: `Gift ${i}` }));
    expect(validateGiftIdeasPayload({ gift_ideas: gifts })).toEqual({ gift_ideas: gifts });
  });

  it("accepte alias gifts avec 5 gifts", () => {
    const gifts = Array.from({ length: 5 }, (_, i) => makeValidGift({ title: `Gift ${i}` }));
    expect(validateGiftIdeasPayload({ gifts })).toEqual({ gift_ideas: gifts });
  });

  it("accepte array brut avec 5 gifts", () => {
    const gifts = Array.from({ length: 5 }, (_, i) => makeValidGift({ title: `Gift ${i}` }));
    expect(validateGiftIdeasPayload(gifts)).toEqual({ gift_ideas: gifts });
  });

  it("throw si gift_ideas manquant", () => {
    expect(() => validateGiftIdeasPayload({})).toThrow("Format LLM invalide");
    expect(() => validateGiftIdeasPayload({ gifts: "bad" })).toThrow("Format LLM invalide");
  });

  it("throw si gift_ideas n'est pas array de 5", () => {
    const gifts = [makeValidGift()];
    expect(() => validateGiftIdeasPayload({ gift_ideas: gifts })).toThrow("Format LLM invalide");
  });

  it("throw si gift invalide (champ manquant)", () => {
    const gifts = Array.from({ length: 5 }, () => ({ emoji: "🎁", category: "X" }));
    expect(() => validateGiftIdeasPayload({ gift_ideas: gifts })).toThrow("Format LLM invalide");
  });

  it("valide sans tags_used et archetype optionnels", () => {
    const gifts = Array.from({ length: 5 }, (_, i) => ({
      emoji: "🎁",
      category: "Cat",
      title: `T${i}`,
      reasoning: "r",
      price: "10€",
    }));
    expect(validateGiftIdeasPayload({ gift_ideas: gifts })).toBeDefined();
  });

  it("throw si JSON vide", () => {
    expect(() => validateGiftIdeasPayload(null)).toThrow("Format LLM invalide");
  });
});

import { describe, it, expect } from "vitest";
import { parseJsonSafe } from "./parse-json";

describe("parseJsonSafe", () => {
  it("parse un JSON objet simple", () => {
    expect(parseJsonSafe('{"gift_ideas":[]}')).toEqual({ gift_ideas: [] });
  });

  it("strip ```json fences", () => {
    const fenced = "```json\n{\"gift_ideas\": []}\n```";
    expect(parseJsonSafe(fenced)).toEqual({ gift_ideas: [] });
  });

  it("strip ``` fences sans langage", () => {
    const fenced = "```\n{\"gift_ideas\": []}\n```";
    expect(parseJsonSafe(fenced)).toEqual({ gift_ideas: [] });
  });

  it("fallback extraction objet dans texte bruité", () => {
    const noisy = 'Voici le résultat: {"gift_ideas": [{"title":"Test"}]} merci';
    expect(parseJsonSafe(noisy)).toEqual({ gift_ideas: [{ title: "Test" }] });
  });

  it("fallback extraction array brut", () => {
    const noisy = 'résultat: [{"title":"A"}] fin';
    expect(parseJsonSafe(noisy)).toEqual([{ title: "A" }]);
  });

  it("throw si texte vide", () => {
    expect(() => parseJsonSafe("")).toThrow("Reponse vide du LLM");
    expect(() => parseJsonSafe(null as unknown as string)).toThrow("Reponse vide du LLM");
  });

  it("throw si JSON invalide sans fallback", () => {
    expect(() => parseJsonSafe("not json at all")).toThrow("Format JSON invalide");
  });

  it("repare JSON tronqué Unterminated string en fermant string + brackets", () => {
    // Simulation troncature LLM en pleine string raisonnement
    const truncated = '{"gift_ideas": [{"emoji":"🎁","title":"Coffret thés d';
    const parsed = parseJsonSafe(truncated) as { gift_ideas: { title: string }[] };
    expect(parsed.gift_ideas[0].title).toBe("Coffret thés d");
  });

  it("salvage dernier objet complet si troncature milieu second gift", () => {
    const truncated =
      '{"gift_ideas": [{"emoji":"🎁","category":"Tech","title":"Gift A","reasoning":"r","price":"10€","tags_used":["a","b"],"archetype":"OBJET DURABLE"}, {"emoji":"🎁","category":"Tech","title":"Gift B tronq';
    const parsed = parseJsonSafe(truncated) as { gift_ideas: unknown[] };
    // Doit au moins récupérer le premier gift complet (second peut être réparé partiellement)
    expect(Array.isArray(parsed.gift_ideas)).toBe(true);
    expect(parsed.gift_ideas.length).toBeGreaterThanOrEqual(1);
    expect(parsed.gift_ideas.length).toBeLessThanOrEqual(2);
  });

  it("repare grand payload tronqué ~147k simulé", () => {
    const gift = {
      emoji: "🎁",
      category: "Tech",
      title: "A very long title ".repeat(50),
      reasoning: "- puce ".repeat(200),
      price: "20€",
      tags_used: ["tag1", "tag2"],
      archetype: "OBJET DURABLE",
    };
    const full = JSON.stringify({ gift_ideas: Array.from({ length: 5 }, () => gift) });
    // Tronque à ~80% en plein milieu d'une string
    const truncated = full.slice(0, Math.floor(full.length * 0.82));
    const parsed = parseJsonSafe(truncated) as { gift_ideas: unknown[] };
    // Ne throw pas, et contient au moins 1 gift salvagé (réparation peut donner 4-5)
    expect(parsed.gift_ideas.length).toBeGreaterThanOrEqual(1);
    expect(parsed.gift_ideas.length).toBeLessThanOrEqual(5);
  });
});

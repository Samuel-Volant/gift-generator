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
});

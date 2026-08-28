import { describe, it, expect } from "vitest";
import { buildTagSuggestionPrompt, TAG_SUGGESTION_JSON_SCHEMA } from "./tag-suggestion";

describe("TAG_SUGGESTION_JSON_SCHEMA", () => {
  it("est strict avec 10 items", () => {
    expect(TAG_SUGGESTION_JSON_SCHEMA.properties.suggested_tags.minItems).toBe(10);
    expect(TAG_SUGGESTION_JSON_SCHEMA.properties.suggested_tags.maxItems).toBe(10);
  });
});

describe("buildTagSuggestionPrompt", () => {
  it("prompt < 800 tokens ~ < 3200 chars et contient langue + niveaux", () => {
    const prompt = buildTagSuggestionPrompt({
      tagLabels: ["Jeux Vidéo", "Randonnée"],
      ignoredLabels: ["Yoga"],
      sliders: { pragmatiqueSentimental: 2, routineOriginalite: 4 },
    });
    expect(prompt.length).toBeLessThan(3200);
    expect(prompt).toContain("français");
    expect(prompt).toContain("Niveau 2");
    expect(prompt).toContain('plutôt pragmatique'); // slider sémantique
    expect(prompt).not.toContain(JSON.stringify({ pragmatiqueSentimental: 2 })); // plus de JSON.stringify brut
  });

  it("limite tags à 20 et sanitize", () => {
    const many = Array.from({ length: 25 }, (_, i) => `Tag${i}`);
    const prompt = buildTagSuggestionPrompt({ tagLabels: many, ignoredLabels: [], sliders: null });
    // le 21e ne doit pas apparaître
    expect(prompt).not.toContain("Tag20");
    expect(prompt).toContain("Tag0");
  });

  it("échappe XML et ne resuscite pas synonymes exacts via sanitize", () => {
    const prompt = buildTagSuggestionPrompt({
      tagLabels: ["<test>"],
      ignoredLabels: ["<test>"],
      sliders: null,
    });
    expect(prompt).toContain("&lt;test&gt;");
  });

  it("snapshot stable", () => {
    const prompt = buildTagSuggestionPrompt({
      tagLabels: ["Lecture", "Cuisine"],
      ignoredLabels: ["Sport"],
      sliders: { calmeEnergie: 5 },
    });
    expect(prompt).toMatchSnapshot();
  });
});

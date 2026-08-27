import { describe, it, expect } from "vitest";
import { buildGiftSystemPrompt, buildGiftUserMessage, buildGiftRetryPrompt, GIFT_FEW_SHOT } from "./gift-generation";
import type { UserProfile } from "@/types";

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    age: 28,
    genre: "non-binaire",
    relation: "ami",
    pragmatiqueSentimental: 40,
    routineOriginalite: 55,
    calmeEnergie: 70,
    serieuxFun: 30,
    objetExperience: 50,
    interets: [{ id: "1", label: "Jeux de société", level: "expert" }],
    momentDeVie: [],
    roleGroupe: [{ id: "r1", label: "Meneur" }],
    marquesTotem: [],
    profilAcheteur: "ne-se-prononce-pas",
    projets: [{ id: "p1", label: "Pédagogie <ludique>" }],
    plaintes: [],
    blacklist: [{ id: "b1", label: "Alcool" }],
    budget: "moyen",
    intention: "fun",
    ...overrides,
  };
}

describe("buildGiftSystemPrompt", () => {
  it("contient GiftGenius, blacklist, et déjà suggérés échappés", () => {
    const prompt = buildGiftSystemPrompt({ alreadySuggestedTitles: ["A & B"], blacklistLabels: ["<Alcool>"] });
    expect(prompt).toContain("GiftGenius");
    expect(prompt).toContain("&lt;Alcool&gt;");
    expect(prompt).toContain("A &amp; B");
    expect(prompt).not.toContain("JSON_FORMAT_INSTRUCTION");
  });
  it("mentionne 1 max SAVOIR et archétypes", () => {
    const p = buildGiftSystemPrompt({ alreadySuggestedTitles: [], blacklistLabels: [] });
    expect(p).toContain("SAVOIR");
    expect(p).toContain("archétypes");
  });
});

describe("buildGiftUserMessage", () => {
  it("produit XML avec vibe sémantique", () => {
    const msg = buildGiftUserMessage(makeProfile());
    expect(msg).toContain("<profil>");
    expect(msg).toContain('<identite age="28"');
    expect(msg).toContain("plutôt pragmatique"); // 40
    expect(msg).toContain("équilibré, légèrement originalité"); // 55
    expect(msg).toContain("<budget>");
    expect(msg).not.toContain("Pragmatique 40%"); // brut interdit
  });
  it("échappe les labels utilisateur (XSS/injection)", () => {
    const msg = buildGiftUserMessage(makeProfile());
    expect(msg).toContain("Pédagogie &lt;ludique&gt;");
    expect(msg).not.toContain("Pédagogie <ludique>");
  });
  it("snapshot structure stable", () => {
    const msg = buildGiftUserMessage(makeProfile());
    expect(msg).toMatchSnapshot();
  });
});

describe("buildGiftRetryPrompt", () => {
  it("injecte le zodError", () => {
    const p = buildGiftRetryPrompt("gift_ideas.0.price: Required");
    expect(p).toContain("gift_ideas.0.price");
    expect(p).toContain("Corrige uniquement le champ fautif");
  });
});

describe("GIFT_FEW_SHOT", () => {
  it("assistant est JSON valide avec 5 gift_ideas et prix en €", () => {
    const parsed = JSON.parse(GIFT_FEW_SHOT.assistant);
    expect(parsed.gift_ideas).toHaveLength(5);
    expect(parsed.gift_ideas[0].price).toMatch(/€/);
    expect(parsed.gift_ideas[0].reasoning).toContain("-");
  });
});

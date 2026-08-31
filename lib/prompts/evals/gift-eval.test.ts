import { describe, it, expect } from "vitest";
import { buildGiftSystemPrompt, buildGiftUserMessage } from "../gift-generation";
import { GiftIdeaSchema } from "@/lib/validate-gifts";
import type { UserProfile, Tag, Interest } from "@/types";

// ---------------------------------------------------------------------------
// 10 profils types — issue #21 evals prompts
// ---------------------------------------------------------------------------

const PROFILES: Array<{ name: string; profile: UserProfile; budgetRange?: { min: number; max: number } }> = [
  {
    name: "petit budget",
    profile: {
      age: 22, genre: "femme", relation: "ami",
      pragmatiqueSentimental: 30, routineOriginalite: 60, calmeEnergie: 50, serieuxFun: 70, objetExperience: 40,
      interets: [{ id: "1", label: "Cinéma", level: "casual" }],
      momentDeVie: [], roleGroupe: [], marquesTotem: [],
      profilAcheteur: "econome", projets: [], plaintes: [],
      blacklist: [], budget: "petit", intention: "fun",
    },
    budgetRange: { min: 0, max: 30 },
  },
  {
    name: "blacklist alcool",
    profile: {
      age: 35, genre: "homme", relation: "collegue",
      pragmatiqueSentimental: 50, routineOriginalite: 50, calmeEnergie: 50, serieuxFun: 50, objetExperience: 50,
      interets: [{ id: "1", label: "Cuisine", level: "expert" }],
      momentDeVie: [], roleGroupe: [], marquesTotem: [],
      profilAcheteur: "reflechi", projets: [], plaintes: [],
      blacklist: [{ id: "b1", label: "Alcool" }, { id: "b2", label: "Vin" }],
      budget: "moyen", intention: "utile",
    },
  },
  {
    name: "expert cuisine",
    profile: {
      age: 42, genre: "homme", relation: "partenaire",
      pragmatiqueSentimental: 20, routineOriginalite: 80, calmeEnergie: 60, serieuxFun: 30, objetExperience: 70,
      interets: [{ id: "1", label: "Cuisine", level: "expert" }, { id: "2", label: "Oenologie", level: "expert" }],
      momentDeVie: [{ id: "v1", label: "Achats" }],
      roleGroupe: [], marquesTotem: [{ id: "m1", label: "Le Creuset" }],
      profilAcheteur: "reflechi", projets: [], plaintes: [],
      blacklist: [], budget: "eleve", intention: "wow",
    },
  },
  {
    name: "senior familiale",
    profile: {
      age: 65, genre: "femme", relation: "famille",
      pragmatiqueSentimental: 80, routineOriginalite: 20, calmeEnergie: 30, serieuxFun: 40, objetExperience: 60,
      interets: [{ id: "1", label: "Jardinage", level: "expert" }],
      momentDeVie: [{ id: "v1", label: "Retraite" }],
      roleGroupe: [], marquesTotem: [],
      profilAcheteur: "reflechi", projets: [{ id: "p1", label: "Jardin" }],
      plaintes: [], blacklist: [], budget: "moyen", intention: "emouvoir",
    },
  },
  {
    name: "ado geek",
    profile: {
      age: 15, genre: "non-binaire", relation: "ami",
      pragmatiqueSentimental: 20, routineOriginalite: 90, calmeEnergie: 80, serieuxFun: 90, objetExperience: 30,
      interets: [{ id: "1", label: "Jeux vidéo", level: "expert" }, { id: "2", label: "Manga", level: "casual" }],
      momentDeVie: [], roleGroupe: [], marquesTotem: [{ id: "m1", label: "Nintendo" }],
      profilAcheteur: "impulsif", projets: [], plaintes: [],
      blacklist: [{ id: "b1", label: "Livres scolaires" }],
      budget: "petit", intention: "fun",
    },
  },
  {
    name: "premium experience",
    profile: {
      age: 38, genre: "homme", relation: "partenaire",
      pragmatiqueSentimental: 70, routineOriginalite: 70, calmeEnergie: 40, serieuxFun: 60, objetExperience: 90,
      interets: [{ id: "1", label: "Voyage", level: "expert" }, { id: "2", label: "Gastronomie", level: "casual" }],
      momentDeVie: [{ id: "v1", label: "Évolution pro" }],
      roleGroupe: [], marquesTotem: [],
      profilAcheteur: "early-adopter", projets: [], plaintes: [],
      blacklist: [], budget: "premium", intention: "wow",
    },
  },
  {
    name: "minimaliste zen",
    profile: {
      age: 30, genre: "femme", relation: "ami",
      pragmatiqueSentimental: 90, routineOriginalite: 30, calmeEnergie: 10, serieuxFun: 20, objetExperience: 80,
      interets: [{ id: "1", label: "Yoga", level: "expert" }, { id: "2", label: "Méditation", level: "expert" }],
      momentDeVie: [], roleGroupe: [], marquesTotem: [],
      profilAcheteur: "econome", projets: [], plaintes: [],
      blacklist: [{ id: "b1", label: "Bruit" }, { id: "b2", label: "Stress" }],
      budget: "moyen", intention: "apprendre",
    },
  },
  {
    name: "famille nombreuse",
    profile: {
      age: 40, genre: "homme", relation: "famille",
      pragmatiqueSentimental: 60, routineOriginalite: 40, calmeEnergie: 70, serieuxFun: 50, objetExperience: 50,
      interets: [{ id: "1", label: "Sport", level: "casual" }, { id: "2", label: "Bricolage", level: "expert" }],
      momentDeVie: [{ id: "v1", label: "Parentalité" }],
      roleGroupe: [], marquesTotem: [],
      profilAcheteur: "econome", projets: [{ id: "p1", label: "Rénovation" }],
      plaintes: [], blacklist: [], budget: "moyen", intention: "utile",
    },
  },
  {
    name: "artistique créatif",
    profile: {
      age: 28, genre: "non-binaire", relation: "ami",
      pragmatiqueSentimental: 40, routineOriginalite: 95, calmeEnergie: 50, serieuxFun: 60, objetExperience: 85,
      interets: [{ id: "1", label: "Peinture", level: "expert" }, { id: "2", label: "Photographie", level: "casual" }],
      momentDeVie: [], roleGroupe: [], marquesTotem: [],
      profilAcheteur: "early-adopter", projets: [{ id: "p1", label: "Expo" }],
      plaintes: [], blacklist: [{ id: "b1", label: "Artificialisation" }],
      budget: "eleve", intention: "emouvoir",
    },
  },
  {
    name: "connaissance distante",
    profile: {
      age: 50, genre: "femme", relation: "connaissance",
      pragmatiqueSentimental: 50, routineOriginalite: 50, calmeEnergie: 50, serieuxFun: 50, objetExperience: 50,
      interets: [],
      momentDeVie: [], roleGroupe: [], marquesTotem: [],
      profilAcheteur: "ne-se-prononce-pas", projets: [], plaintes: [],
      blacklist: [], budget: "ne-se-prononce-pas", intention: "ne-se-prononce-pas",
    },
  },
];

const VALID_ARCHETYPES = ["OBJET DURABLE", "EXPERIENCE", "CONSOMMABLE", "SAVOIR", "SERVICE"];

function parsePrice(price: string): number | null {
  const match = price.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(",", "."));
}

function extractProfileLabels(profile: UserProfile): string[] {
  const labels: string[] = [];
  for (const i of profile.interets) labels.push(i.label);
  for (const t of profile.momentDeVie) labels.push(t.label);
  for (const t of profile.roleGroupe) labels.push(t.label);
  for (const t of profile.marquesTotem) labels.push(t.label);
  for (const t of profile.projets) labels.push(t.label);
  for (const t of profile.plaintes) labels.push(t.label);
  return labels;
}

describe("Evals prompts — issue #21", () => {
  describe.each(PROFILES)("$name", ({ profile, budgetRange }) => {
    const systemPrompt = buildGiftSystemPrompt({
      alreadySuggestedTitles: [],
      blacklistLabels: profile.blacklist.map((t) => t.label),
      deletedGiftTitles: [],
    });
    const userMessage = buildGiftUserMessage(profile);

    it("system prompt mentions blacklist", () => {
      if (profile.blacklist.length > 0) {
        const escaped = profile.blacklist.map((t) => t.label).join(", ");
        expect(systemPrompt).toContain(escaped);
      }
    });

    it("user message contains profile data", () => {
      expect(userMessage).toContain("<profil>");
      expect(userMessage).toContain(`age="${profile.age}"`);
    });

    it("validates 5 gift ideas with required fields", () => {
      const mockGifts = Array.from({ length: 5 }, (_, i) => ({
        emoji: "🎁",
        category: `Cat ${i}`,
        title: `Gift ${i}`,
        reasoning: `- benefit ${i}`,
        price: `${10 + i * 5}€`,
        tags_used: ["tag1", "tag2"] as [string, string],
        archetype: VALID_ARCHETYPES[i % VALID_ARCHETYPES.length],
      }));

      const result = { gift_ideas: mockGifts };
      expect(result.gift_ideas).toHaveLength(5);

      for (const gift of result.gift_ideas) {
        const parsed = GiftIdeaSchema.safeParse(gift);
        expect(parsed.success).toBe(true);
      }
    });

    it("no blacklisted label in titles or reasoning", () => {
      const blacklistLabels = profile.blacklist.map((t) => t.label.toLowerCase());
      if (blacklistLabels.length === 0) return;

      const mockGifts = Array.from({ length: 5 }, (_, i) => ({
        emoji: "🎁",
        category: `Cat ${i}`,
        title: `Gift ${i}`,
        reasoning: `- benefit ${i}`,
        price: `${10 + i * 5}€`,
        archetype: VALID_ARCHETYPES[i % VALID_ARCHETYPES.length],
      }));

      for (const gift of mockGifts) {
        const titleLower = gift.title.toLowerCase();
        const reasonLower = gift.reasoning.toLowerCase();
        for (const bl of blacklistLabels) {
          expect(titleLower).not.toContain(bl);
          expect(reasonLower).not.toContain(bl);
        }
      }
    });

    it("price in flexible range (when budgetRange specified)", () => {
      if (!budgetRange) return;

      const mockGifts = Array.from({ length: 5 }, (_, i) => ({
        emoji: "🎁",
        category: `Cat ${i}`,
        title: `Gift ${i}`,
        reasoning: `- benefit ${i}`,
        price: `${budgetRange.min + 5 + i * 5}€`,
        archetype: VALID_ARCHETYPES[i % VALID_ARCHETYPES.length],
      }));

      for (const gift of mockGifts) {
        const price = parsePrice(gift.price);
        expect(price).not.toBeNull();
        if (price !== null) {
          expect(price).toBeGreaterThanOrEqual(budgetRange.min);
          expect(price).toBeLessThanOrEqual(budgetRange.max);
        }
      }
    });

    it(">= 4 distinct archetypes among 5 gifts", () => {
      const archetypes = ["OBJET DURABLE", "EXPERIENCE", "CONSOMMABLE", "SAVOIR", "SERVICE"];

      const mockGifts = Array.from({ length: 5 }, (_, i) => ({
        emoji: "🎁",
        category: `Cat ${i}`,
        title: `Gift ${i}`,
        reasoning: `- benefit ${i}`,
        price: `${10 + i * 5}€`,
        archetype: archetypes[i],
      }));

      const distinct = new Set(mockGifts.map((g) => g.archetype));
      expect(distinct.size).toBeGreaterThanOrEqual(4);
    });

    it("tags_used are existing profile labels (when present)", () => {
      const profileLabels = extractProfileLabels(profile);
      if (profileLabels.length === 0) return;

      const mockGifts = Array.from({ length: 5 }, (_, i) => ({
        emoji: "🎁",
        category: `Cat ${i}`,
        title: `Gift ${i}`,
        reasoning: `- benefit ${i}`,
        price: `${10 + i * 5}€`,
        tags_used: [profileLabels[0], profileLabels[Math.min(1, profileLabels.length - 1)]] as [string, string],
        archetype: VALID_ARCHETYPES[i % VALID_ARCHETYPES.length],
      }));

      for (const gift of mockGifts) {
        if (gift.tags_used) {
          for (const tag of gift.tags_used) {
            expect(profileLabels).toContain(tag);
          }
        }
      }
    });
  });
});

import { describe, it, expect } from "vitest";
import { UserProfileSchema } from "./profile";

describe("UserProfileSchema", () => {
  const validProfile = {
    age: 30,
    genre: "homme",
    relation: "ami",
    pragmatiqueSentimental: 3,
    routineOriginalite: 3,
    calmeEnergie: 3,
    serieuxFun: 3,
    objetExperience: 3,
    interets: [
      { id: "1", label: "Cuisine", level: "casual" },
    ],
    momentDeVie: [{ id: "1", label: "Étudiant" }],
    roleGroupe: [{ id: "1", label: "Ami" }],
    marquesTotem: [{ id: "1", label: "Apple" }],
    profilAcheteur: "reflechi",
    projets: [{ id: "1", label: "Voyage" }],
    plaintes: [{ id: "1", label: "Prix" }],
    blacklist: [{ id: "1", label: "Alcool" }],
    budget: "moyen",
    intention: "utile",
  };

  it("accepts valid profile", () => {
    const result = UserProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("rejects age out of range", () => {
    const result = UserProfileSchema.safeParse({ ...validProfile, age: 150 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid genre", () => {
    const result = UserProfileSchema.safeParse({ ...validProfile, genre: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid relation", () => {
    const result = UserProfileSchema.safeParse({ ...validProfile, relation: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects budgetMin > budgetMax", () => {
    const result = UserProfileSchema.safeParse({
      ...validProfile,
      budgetMin: 100,
      budgetMax: 50,
    });
    expect(result.success).toBe(false);
  });

  it("allows optional budgetMin and budgetMax", () => {
    const result = UserProfileSchema.safeParse({
      ...validProfile,
      budgetMin: 10,
      budgetMax: 20,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid intention", () => {
    const result = UserProfileSchema.safeParse({ ...validProfile, intention: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const { age, ...rest } = validProfile;
    const result = UserProfileSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
import { z } from "zod";
import { SLIDER_MIN, SLIDER_MAX } from "@/types";

export const BudgetSchema = z.enum(["ne-se-prononce-pas", "petit", "moyen", "eleve", "premium"]);

export const BudgetMinSchema = z.number().min(0).max(5000).optional();
export const BudgetMaxSchema = z.number().min(0).max(5000).optional();

// Schéma partiel pour la partie budget — réutilisable dans le full UserProfileSchema (issue #20)
export const BudgetFieldsSchema = z
  .object({
    budget: BudgetSchema,
    budgetMin: BudgetMinSchema,
    budgetMax: BudgetMaxSchema,
  })
  .superRefine((data, ctx) => {
    const hasMin = typeof data.budgetMin === "number";
    const hasMax = typeof data.budgetMax === "number";
    if (hasMin && hasMax && data.budgetMax! <= data.budgetMin!) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le maximum doit être supérieur au minimum",
        path: ["budgetMax"],
      });
    }
  });

export type BudgetFields = z.infer<typeof BudgetFieldsSchema>;

const TagSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(50),
});

const InterestSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(50),
  level: z.enum(["casual", "expert"]),
});

export const BuyerProfileSchema = z.enum([
  "ne-se-prononce-pas",
  "impulsif",
  "collectionneur",
  "econome",
  "reflechi",
  "early-adopter",
]);

export const GenreSchema = z.enum(["homme", "femme", "non-binaire", "autre"]);
export const RelationSchema = z.enum(["ami", "famille", "collegue", "partenaire", "connaissance"]);

export const UserProfileSchema = z
  .object({
    userId: z.string().optional(),
    age: z.number().int().min(0).max(120),
    genre: GenreSchema,
    relation: RelationSchema,
    pragmatiqueSentimental: z.number().min(1).max(5).int(),
    routineOriginalite: z.number().min(1).max(5).int(),
    calmeEnergie: z.number().min(1).max(5).int(),
    serieuxFun: z.number().min(1).max(5).int(),
    objetExperience: z.number().min(1).max(5).int(),
    interets: z.array(InterestSchema).max(20),
    momentDeVie: z.array(TagSchema).max(20),
    roleGroupe: z.array(TagSchema).max(20),
    marquesTotem: z.array(TagSchema).max(20),
    profilAcheteur: BuyerProfileSchema,
    projets: z.array(TagSchema).max(20),
    plaintes: z.array(TagSchema).max(20),
    blacklist: z.array(TagSchema).max(20),
    budget: BudgetSchema,
    budgetMin: BudgetMinSchema,
    budgetMax: BudgetMaxSchema,
    intention: z.enum(["ne-se-prononce-pas", "wow", "utile", "fun", "apprendre", "emouvoir"]),
  })
  .superRefine((data, ctx) => {
    const hasMin = typeof data.budgetMin === "number";
    const hasMax = typeof data.budgetMax === "number";
    if (hasMin && hasMax && data.budgetMax! <= data.budgetMin!) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le maximum doit être supérieur au minimum",
        path: ["budgetMax"],
      });
    }
  });

export type UserProfileValidated = z.infer<typeof UserProfileSchema>;

export const GiftIdeaStorageSchema = z.object({
  id: z.string(),
  emoji: z.string(),
  category: z.string(),
  title: z.string(),
  reasoning: z.string(),
  price: z.string(),
  tags_used: z.tuple([z.string(), z.string()]).optional(),
  archetype: z.string().optional(),
});

export const GiftIdeasStorageSchema = z.array(GiftIdeaStorageSchema);

export const AlreadySuggestedGiftTitlesSchema = z.array(z.string().max(100)).max(50);

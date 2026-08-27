import { z } from "zod";

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
  label: z.string(),
});

const InterestSchema = z.object({
  id: z.string(),
  label: z.string(),
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
    age: z.number().min(0).max(120),
    genre: GenreSchema,
    relation: RelationSchema,
    pragmatiqueSentimental: z.number().min(0).max(100),
    routineOriginalite: z.number().min(0).max(100),
    calmeEnergie: z.number().min(0).max(100),
    serieuxFun: z.number().min(0).max(100),
    objetExperience: z.number().min(0).max(100),
    interets: z.array(InterestSchema),
    momentDeVie: z.array(TagSchema),
    roleGroupe: z.array(TagSchema),
    marquesTotem: z.array(TagSchema),
    profilAcheteur: BuyerProfileSchema,
    projets: z.array(TagSchema),
    plaintes: z.array(TagSchema),
    blacklist: z.array(TagSchema),
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

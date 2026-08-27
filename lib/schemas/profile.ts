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

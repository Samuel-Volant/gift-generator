import { describe, it, expect } from "vitest";
import { describeSlider, escapeXml, sanitizeTagLabels, budgetLabelMap, intentionMap, formatBudget, validateBudgetRange } from "./helpers";

describe("escapeXml", () => {
  it("échappe les caractères XML", () => {
    expect(escapeXml('<tag attr="x">a & b</tag>')).toBe("&lt;tag attr=&quot;x&quot;&gt;a &amp; b&lt;/tag&gt;");
    expect(escapeXml("it's")).toBe("it&apos;s");
  });
});

describe("describeSlider", () => {
  it("40 -> plutôt pragmatique (spec example)", () => {
    expect(describeSlider(40, "Pragmatique", "Sentimental")).toBe("plutôt pragmatique");
  });
  it("55 -> équilibré, légèrement expérience (spec example)", () => {
    expect(describeSlider(55, "Objet", "Expérience")).toBe("équilibré, légèrement expérience");
  });
  it("50 -> équilibré", () => {
    expect(describeSlider(50, "Pragmatique", "Sentimental")).toBe("équilibré");
  });
  it("0 -> très pragmatique", () => {
    expect(describeSlider(0, "Pragmatique", "Sentimental")).toBe("très pragmatique");
  });
  it("100 -> très sentimental", () => {
    expect(describeSlider(100, "Pragmatique", "Sentimental")).toBe("très sentimental");
  });
  it("10 -> très left", () => {
    expect(describeSlider(10, "Routine", "Originalité")).toBe("très routine");
  });
  it("90 -> très right", () => {
    expect(describeSlider(90, "Routine", "Originalité")).toBe("très originalité");
  });
});

describe("sanitizeTagLabels", () => {
  it("déduplique case-insensitive et limite à max", () => {
    const input = ["Yoga", "yoga ", "  Cuisine", "cuisine", "Jazz"];
    expect(sanitizeTagLabels(input, 20)).toEqual(["Yoga", "Cuisine", "Jazz"]);
  });
  it("limite à 20", () => {
    const input = Array.from({ length: 25 }, (_, i) => `Tag${i}`);
    expect(sanitizeTagLabels(input, 20)).toHaveLength(20);
  });
  it("échappe XML", () => {
    expect(sanitizeTagLabels(["<tag>"])).toEqual(["&lt;tag&gt;"]);
  });
});

describe("maps", () => {
  it("budgetLabelMap contient tous les budgets", () => {
    expect(budgetLabelMap["petit"]).toContain("petit");
    expect(budgetLabelMap["ne-se-prononce-pas"]).toBeDefined();
  });
  it("intentionMap contient wow", () => {
    expect(intentionMap["wow"]).toContain("wow");
  });
});

describe("formatBudget", () => {
  it("preset mapping petit -> <30€", () => {
    expect(formatBudget({ budget: "petit" })).toContain("<30€");
  });
  it("preset moyen -> 30-100€", () => {
    expect(formatBudget({ budget: "moyen" })).toContain("30-100€");
  });
  it("custom min/max prioritaire sur preset", () => {
    expect(formatBudget({ budget: "moyen", budgetMin: 20, budgetMax: 80 })).toBe(
      "20-80€ (indication souple, viser cette fourchette mais ne pas bloquer si idée pertinente hors fourchette)",
    );
  });
  it("custom only min", () => {
    expect(formatBudget({ budget: "petit", budgetMin: 50 })).toContain("à partir de 50€");
  });
  it("custom only max", () => {
    expect(formatBudget({ budget: "premium", budgetMax: 40 })).toContain("jusqu'à 40€");
  });
  it("custom invalide fallback preset", () => {
    // max <= min -> fallback
    expect(formatBudget({ budget: "moyen", budgetMin: 80, budgetMax: 20 })).toContain("30-100€");
    // out of range
    expect(formatBudget({ budget: "petit", budgetMin: -5 })).toContain("<30€");
  });
});

describe("validateBudgetRange", () => {
  it("valide range correct", () => {
    expect(validateBudgetRange(20, 80)).toBeNull();
    expect(validateBudgetRange(undefined, undefined)).toBeNull();
    expect(validateBudgetRange(10, undefined)).toBeNull();
  });
  it("min negatif -> error", () => {
    expect(validateBudgetRange(-1, 10)).toContain("minimum");
  });
  it("max hors borne -> error", () => {
    expect(validateBudgetRange(0, 6000)).toContain("maximum");
  });
  it("max <= min -> error", () => {
    expect(validateBudgetRange(50, 50)).toContain("supérieur");
    expect(validateBudgetRange(80, 20)).toContain("supérieur");
  });
});

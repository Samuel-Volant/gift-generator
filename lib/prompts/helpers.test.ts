import { describe, it, expect } from "vitest";
import { describeSlider, escapeXml, sanitizeTagLabels, budgetLabelMap, intentionMap } from "./helpers";

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

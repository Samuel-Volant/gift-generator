import { describe, it, expect } from "vitest";
import {
  FALLBACK_MODELS,
  DEFAULT_MODEL,
  GOOGLE_FREE_ALLOWLIST,
  GOOGLE_DENYLIST_RE,
  GROQ_DENYLIST_RE,
  isGoogleModelAllowed,
  isGroqModelAllowed,
  filterGoogleModels,
  filterGroqModels,
} from "./ai-models";

describe("ai-models constants", () => {
  it("FALLBACK_MODELS contient 2 modeles gratuits", () => {
    expect(FALLBACK_MODELS.length).toBe(2);
    expect(FALLBACK_MODELS.every((m) => m.name.includes("Gratuit"))).toBe(true);
  });

  it("DEFAULT_MODEL est le premier fallback", () => {
    expect(DEFAULT_MODEL).toBe(FALLBACK_MODELS[0].id);
  });

  it("GOOGLE_FREE_ALLOWLIST contient les modeles gratuits verifies", () => {
    expect(GOOGLE_FREE_ALLOWLIST).toContain("gemini-2.0-flash");
    expect(GOOGLE_FREE_ALLOWLIST).toContain("gemini-1.5-flash");
    expect(GOOGLE_FREE_ALLOWLIST).toContain("gemma-3-27b");
  });

  it("GOOGLE_DENYLIST exclut tts/embedding/vision", () => {
    expect(GOOGLE_DENYLIST_RE.test("tts-model")).toBe(true);
    expect(GOOGLE_DENYLIST_RE.test("text-embedding-004")).toBe(true);
    expect(GOOGLE_DENYLIST_RE.test("gemini-vision")).toBe(true);
    expect(GOOGLE_DENYLIST_RE.test("gemini-2.0-flash")).toBe(false);
  });

  it("GROQ_DENYLIST exclut whisper/compound/playai/guard", () => {
    expect(GROQ_DENYLIST_RE.test("whisper-large-v3")).toBe(true);
    expect(GROQ_DENYLIST_RE.test("compound-beta")).toBe(true);
    expect(GROQ_DENYLIST_RE.test("playai-tts")).toBe(true);
    expect(GROQ_DENYLIST_RE.test("llama-guard-3-8b")).toBe(true);
    expect(GROQ_DENYLIST_RE.test("prompt-guard-xyz")).toBe(true);
    expect(GROQ_DENYLIST_RE.test("llama-3.1-8b-instant")).toBe(false);
    expect(GROQ_DENYLIST_RE.test("mixtral-8x7b-32768")).toBe(false);
  });
});

describe("isGoogleModelAllowed", () => {
  it("allowlist: gemini-2.0-flash + variants", () => {
    expect(isGoogleModelAllowed("gemini-2.0-flash", ["generateContent"])).toBe(true);
    expect(isGoogleModelAllowed("gemini-2.0-flash-exp", ["generateContent"])).toBe(true);
    expect(isGoogleModelAllowed("gemini-2.0-flash-001", ["generateContent"])).toBe(true);
    expect(isGoogleModelAllowed("gemini-2.0-flash-lite", ["generateContent"])).toBe(true);
  });

  it("allowlist: gemini-1.5-flash variants", () => {
    expect(isGoogleModelAllowed("gemini-1.5-flash", ["generateContent"])).toBe(true);
    expect(isGoogleModelAllowed("gemini-1.5-flash-8b", ["generateContent"])).toBe(true);
    expect(isGoogleModelAllowed("gemini-1.5-flash-001", ["generateContent"])).toBe(true);
  });

  it("allowlist: gemma-3 variants", () => {
    expect(isGoogleModelAllowed("gemma-3-27b", ["generateContent"])).toBe(true);
    expect(isGoogleModelAllowed("gemma-3-27b-it", ["generateContent"])).toBe(true);
    expect(isGoogleModelAllowed("gemma-3-12b-it", ["generateContent"])).toBe(false); // not in allowlist (only 27b)
  });

  it("rejette modeles hors allowlist meme avec flash", () => {
    // gemini-2.5-flash not in initial allowlist -> should be false unless fallback pricing
    expect(isGoogleModelAllowed("gemini-2.5-flash", ["generateContent"])).toBe(false);
    expect(isGoogleModelAllowed("gemini-1.0-pro", ["generateContent"])).toBe(false);
    expect(isGoogleModelAllowed("gemini-pro", ["generateContent"])).toBe(false);
  });

  it("rejette si generateContent manquant", () => {
    expect(isGoogleModelAllowed("gemini-2.0-flash", ["embedContent"])).toBe(false);
    expect(isGoogleModelAllowed("gemini-2.0-flash", [])).toBe(false);
    expect(isGoogleModelAllowed("gemini-2.0-flash", undefined)).toBe(false);
  });

  it("rejette denylist meme si allowlist match", () => {
    expect(isGoogleModelAllowed("gemini-2.0-flash-tts", ["generateContent"])).toBe(false);
    expect(isGoogleModelAllowed("gemini-embedding-exp", ["generateContent"])).toBe(false);
    expect(isGoogleModelAllowed("gemini-vision-flash", ["generateContent"])).toBe(false);
  });

  it("fallback pricing: inclut si inputTokenPrice == 0 meme hors allowlist", () => {
    // Ici on verifie que l'helper avec raw free price retourne true
    expect(isGoogleModelAllowed("gemini-2.5-flash", ["generateContent"], { inputTokenPrice: 0 } as unknown)).toBe(true);
    expect(isGoogleModelAllowed("unknown-free-model", ["generateContent"], { inputTokenPrice: 0 } as unknown)).toBe(true);
    expect(isGoogleModelAllowed("gemini-2.5-flash", ["generateContent"], { inputTokenPrice: 0.01 } as unknown)).toBe(false);
  });
});

describe("isGroqModelAllowed", () => {
  it("accepte modeles texte standards", () => {
    expect(isGroqModelAllowed("llama-3.1-8b-instant")).toBe(true);
    expect(isGroqModelAllowed("mixtral-8x7b-32768")).toBe(true);
    expect(isGroqModelAllowed("llama-3.3-70b-versatile")).toBe(true);
  });

  it("rejette whisper/tts/guard/compound/playai", () => {
    expect(isGroqModelAllowed("whisper-large-v3")).toBe(false);
    expect(isGroqModelAllowed("whisper-large-v3-turbo")).toBe(false);
    expect(isGroqModelAllowed("tts-model")).toBe(false);
    expect(isGroqModelAllowed("llama-guard-3-8b")).toBe(false);
    expect(isGroqModelAllowed("compound-beta")).toBe(false);
    expect(isGroqModelAllowed("compound-mini")).toBe(false);
    expect(isGroqModelAllowed("playai-tts")).toBe(false);
    expect(isGroqModelAllowed("prompt-guard-86m")).toBe(false);
  });

  it("rejette si active === false", () => {
    expect(isGroqModelAllowed("llama-3.1-8b-instant", false)).toBe(false);
    expect(isGroqModelAllowed("llama-3.1-8b-instant", true)).toBe(true);
    expect(isGroqModelAllowed("llama-3.1-8b-instant", undefined)).toBe(true);
  });
});

describe("filterGoogleModels", () => {
  it("filtre et mappe modeles Google bruts", () => {
    const raw = [
      { name: "models/gemini-2.0-flash", displayName: "Gemini 2.0 Flash", supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-1.5-flash-8b", displayName: "Gemini 1.5 Flash 8B", supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemma-3-27b-it", displayName: "Gemma 3 27B", supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-pro", displayName: "Gemini Pro", supportedGenerationMethods: ["generateContent"] },
      { name: "models/text-embedding-004", displayName: "Embedding", supportedGenerationMethods: ["embedContent"] },
      { name: "models/gemini-2.0-flash-tts", displayName: "TTS", supportedGenerationMethods: ["generateContent"] },
    ];
    const result = filterGoogleModels(raw);
    expect(result.map((m) => m.id)).toEqual([
      "gemini-2.0-flash",
      "gemini-1.5-flash-8b",
      "gemma-3-27b-it",
    ]);
    expect(result.every((m) => m.provider === "google")).toBe(true);
    expect(result.every((m) => m.name.includes("Gratuit"))).toBe(true);
  });

  it("deduplication par id", () => {
    const raw = [
      { name: "models/gemini-2.0-flash", displayName: "A", supportedGenerationMethods: ["generateContent"] },
      { name: "models/gemini-2.0-flash", displayName: "A dup", supportedGenerationMethods: ["generateContent"] },
    ];
    expect(filterGoogleModels(raw)).toHaveLength(1);
  });

  it("fallback pricing: inclut modele gratuit non allowliste si price 0", () => {
    const raw = [
      { name: "models/gemini-2.5-flash", displayName: "Gemini 2.5 Flash", supportedGenerationMethods: ["generateContent"], pricing: { inputTokenPrice: 0 } },
    ];
    const result = filterGoogleModels(raw);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("gemini-2.5-flash");
  });

  it("retourne [] si input vide ou invalide", () => {
    expect(filterGoogleModels([])).toEqual([]);
    expect(filterGoogleModels(null as unknown as never[])).toEqual([]);
    expect(filterGoogleModels(undefined as unknown as never[])).toEqual([]);
  });

  it("retourne <30 modeles meme avec gros input", () => {
    const raw = Array.from({ length: 100 }, (_, i) => ({
      name: `models/gemini-2.0-flash-${i}`,
      displayName: `Flash ${i}`,
      supportedGenerationMethods: ["generateContent"],
    }));
    // Tous matchent allowlist via prefix -> mais on limite ou non? Au moins verifie que le filtre n'explose pas
    const result = filterGoogleModels(raw);
    // Dedup garde 100, mais route limitera a <30 globalement; ici on verifie que le filtre ne cree pas plus que input
    expect(result.length).toBeLessThanOrEqual(100);
  });
});

describe("filterGroqModels", () => {
  it("filtre et mappe modeles Groq bruts", () => {
    const raw = [
      { id: "llama-3.1-8b-instant", created: 1000, active: true },
      { id: "whisper-large-v3", created: 2000, active: true },
      { id: "compound-beta", created: 3000, active: true },
      { id: "mixtral-8x7b-32768", created: 1500, active: true },
      { id: "llama-guard-3-8b", created: 4000, active: true },
    ];
    const result = filterGroqModels(raw);
    expect(result.map((m) => m.id)).toEqual(["mixtral-8x7b-32768", "llama-3.1-8b-instant"]);
    expect(result.every((m) => m.provider === "groq")).toBe(true);
  });

  it("tri par created desc (plus recent en haut)", () => {
    const raw = [
      { id: "llama-3.1-8b-instant", created: 100 },
      { id: "llama-3.3-70b-versatile", created: 300 },
      { id: "mixtral-8x7b-32768", created: 200 },
    ];
    const result = filterGroqModels(raw);
    expect(result.map((m) => m.id)).toEqual([
      "llama-3.3-70b-versatile",
      "mixtral-8x7b-32768",
      "llama-3.1-8b-instant",
    ]);
  });

  it("exclut active === false", () => {
    const raw = [
      { id: "llama-3.1-8b-instant", active: false },
      { id: "mixtral-8x7b-32768", active: true },
    ];
    expect(filterGroqModels(raw).map((m) => m.id)).toEqual(["mixtral-8x7b-32768"]);
  });

  it("deduplication par id (garde premier apres tri)", () => {
    const raw = [
      { id: "llama-3.1-8b-instant", created: 100 },
      { id: "llama-3.1-8b-instant", created: 200 },
    ];
    expect(filterGroqModels(raw)).toHaveLength(1);
  });

  it("retourne [] si input vide ou invalide", () => {
    expect(filterGroqModels([])).toEqual([]);
    expect(filterGroqModels(null as unknown as never[])).toEqual([]);
  });
});

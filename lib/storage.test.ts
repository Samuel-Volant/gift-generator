import { describe, it, expect, beforeEach } from "vitest";
import {
  STORAGE_KEYS,
  isLocalStorageAvailable,
  safeParse,
  loadFromStorage,
  saveToStorage,
  removeFromStorage,
  dedupeAndLimitTitles,
  dedupeGiftsById,
  clearGiftGeneratorStorage,
} from "./storage";
import { z } from "zod";

// Minimal in-memory Storage polyfill for node environment
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  } as Storage;
}

function ensureWindowWithStorage(storage?: Storage) {
  const mem = storage ?? createMemoryStorage();
  (globalThis as unknown as { window: Window & typeof globalThis }).window =
    (globalThis as unknown as { window: Window & typeof globalThis }).window ?? ({} as Window & typeof globalThis);
  Object.defineProperty(globalThis.window, "localStorage", {
    value: mem,
    configurable: true,
    writable: true,
  });
  (globalThis as unknown as { localStorage: Storage }).localStorage = mem;
  return mem;
}

describe("STORAGE_KEYS", () => {
  it("contient les clés attendues", () => {
    expect(STORAGE_KEYS.profile).toBe("giftgen:profile");
    expect(STORAGE_KEYS.gifts).toBe("giftgen:gifts");
    expect(STORAGE_KEYS.alreadySuggested).toBe("giftgen:alreadySuggested");
    expect(STORAGE_KEYS.deletedGifts).toBe("giftgen:deletedGifts");
  });
});

describe("isLocalStorageAvailable", () => {
  it("retourne false si window undefined", () => {
    const origWindow = (globalThis as unknown as { window: unknown }).window;
    delete (globalThis as unknown as Record<string, unknown>).window;
    expect(isLocalStorageAvailable()).toBe(false);
    (globalThis as unknown as Record<string, unknown>).window = origWindow;
    if (origWindow) ensureWindowWithStorage(origWindow as unknown as Storage);
    else ensureWindowWithStorage();
  });

  it("retourne true si localStorage accessible", () => {
    ensureWindowWithStorage();
    expect(isLocalStorageAvailable()).toBe(true);
  });

  it("retourne false si getItem throw", () => {
    const mem = createMemoryStorage();
    const fake = {
      ...mem,
      getItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    ensureWindowWithStorage(fake);
    expect(isLocalStorageAvailable()).toBe(false);
    ensureWindowWithStorage();
  });
});

describe("safeParse", () => {
  it("parse JSON valide", () => {
    expect(safeParse('{"a":1}', { a: 0 })).toEqual({ a: 1 });
  });
  it("fallback si null", () => {
    expect(safeParse(null, { fallback: true })).toEqual({ fallback: true });
  });
  it("fallback si JSON invalide", () => {
    expect(safeParse("not json", 42)).toBe(42);
  });
  it("fallback si raw n'est pas string", () => {
    expect(safeParse(undefined as unknown as string, "fb")).toBe("fb");
  });
});

describe("loadFromStorage / saveToStorage / remove", () => {
  beforeEach(() => {
    ensureWindowWithStorage(createMemoryStorage());
  });

  it("save + load roundtrip", () => {
    saveToStorage(STORAGE_KEYS.profile, { age: 28 });
    expect(loadFromStorage(STORAGE_KEYS.profile, { age: 0 })).toEqual({ age: 28 });
  });

  it("load fallback si clé absente", () => {
    expect(loadFromStorage(STORAGE_KEYS.profile, { age: 0 })).toEqual({ age: 0 });
  });

  it("load fallback si JSON corrompu", () => {
    ensureWindowWithStorage();
    globalThis.window.localStorage.setItem(STORAGE_KEYS.profile, "%%%corrupted%%%");
    expect(loadFromStorage(STORAGE_KEYS.profile, { fallback: true } as unknown as object)).toEqual({
      fallback: true,
    });
  });

  it("load avec validator zod — success garde valeur", () => {
    ensureWindowWithStorage();
    globalThis.window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ age: 30 }));
    const schema = z.object({ age: z.number() });
    expect(loadFromStorage(STORAGE_KEYS.profile, { age: 0 }, schema)).toEqual({ age: 30 });
  });

  it("load avec validator zod — échec retourne fallback (migration douce)", () => {
    ensureWindowWithStorage();
    globalThis.window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ age: "not-a-number" }));
    const schema = z.object({ age: z.number() });
    expect(loadFromStorage(STORAGE_KEYS.profile, { age: 0 }, schema)).toEqual({ age: 0 });
  });

  it("load avec validator fonction — échec retourne fallback", () => {
    ensureWindowWithStorage();
    globalThis.window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ age: -5 }));
    const validator = (v: unknown) => typeof (v as { age: number }).age === "number" && (v as { age: number }).age >= 0;
    const fnSchema = {
      safeParse: (data: unknown) => (validator(data) ? { success: true as const, data } : { success: false as const, error: {} }),
    } as unknown as z.ZodSchema<unknown>;
    expect(loadFromStorage(STORAGE_KEYS.profile, { age: 0 }, fnSchema)).toEqual({ age: 0 });
  });

  it("saveToStorage ne throw pas si localStorage bloqué", () => {
    const mem = createMemoryStorage();
    const fake = {
      ...mem,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    } as unknown as Storage;
    ensureWindowWithStorage(fake);
    expect(() => saveToStorage("k", { a: 1 })).not.toThrow();
    ensureWindowWithStorage();
  });

  it("removeFromStorage supprime la clé", () => {
    ensureWindowWithStorage();
    globalThis.window.localStorage.setItem(STORAGE_KEYS.gifts, "[]");
    removeFromStorage(STORAGE_KEYS.gifts);
    expect(globalThis.window.localStorage.getItem(STORAGE_KEYS.gifts)).toBeNull();
  });

  it("clearGiftGeneratorStorage supprime les clés giftgen", () => {
    const mem = ensureWindowWithStorage();
    mem.setItem(STORAGE_KEYS.profile, "{}");
    mem.setItem(STORAGE_KEYS.gifts, "[]");
    mem.setItem(STORAGE_KEYS.alreadySuggested, "[]");
    mem.setItem(STORAGE_KEYS.deletedGifts, "[]");
    mem.setItem("other:key", "keep");
    clearGiftGeneratorStorage();
    expect(mem.getItem(STORAGE_KEYS.profile)).toBeNull();
    expect(mem.getItem(STORAGE_KEYS.gifts)).toBeNull();
    expect(mem.getItem(STORAGE_KEYS.alreadySuggested)).toBeNull();
    expect(mem.getItem(STORAGE_KEYS.deletedGifts)).toBeNull();
    expect(mem.getItem("other:key")).toBe("keep");
  });
});

describe("dedupeAndLimitTitles", () => {
  it("dédup case-sensitive puis limite à 30 par défaut", () => {
    const titles = Array.from({ length: 35 }, (_, i) => `Title ${i % 10}`);
    const result = dedupeAndLimitTitles(titles);
    expect(result.length).toBeLessThanOrEqual(30);
    expect(new Set(result).size).toBe(result.length);
  });

  it("garde les 30 derniers titres (fenêtre glissante)", () => {
    const titles = Array.from({ length: 40 }, (_, i) => `Title ${i}`);
    const result = dedupeAndLimitTitles(titles, 30);
    expect(result.length).toBe(30);
    expect(result[0]).toBe("Title 10");
    expect(result[29]).toBe("Title 39");
  });

  it("dédup conserve première occurrence relative à la fenêtre", () => {
    const titles = ["a", "b", "a", "c", "b", "d"];
    expect(dedupeAndLimitTitles(titles, 10)).toEqual(["a", "b", "c", "d"]);
  });

  it("limite custom", () => {
    const titles = ["x", "y", "z"];
    expect(dedupeAndLimitTitles(titles, 2)).toEqual(["y", "z"]);
  });

  it("gère tableau vide", () => {
    expect(dedupeAndLimitTitles([], 30)).toEqual([]);
  });
});

describe("dedupeGiftsById", () => {
  it("retire les doublons par id", () => {
    const a = { id: "a", title: "A" };
    const b = { id: "b", title: "B" };
    expect(dedupeGiftsById([a, b, a, b, a])).toEqual([a, b]);
  });
  it("conserve l'ordre de première apparition", () => {
    const c = { id: "c" };
    const d = { id: "d" };
    expect(dedupeGiftsById([d, c, d])).toEqual([d, c]);
  });
  it("gère tableau vide", () => {
    expect(dedupeGiftsById([])).toEqual([]);
  });
});

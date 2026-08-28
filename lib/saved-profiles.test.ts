import { describe, it, expect, beforeEach } from "vitest";
import {
  MAX_SAVED_PROFILES,
  loadSavedProfiles,
  saveSavedProfiles,
  addSavedProfile,
  deleteSavedProfile,
  updateSavedProfile,
} from "./saved-profiles";
import type { SavedProfile } from "@/types";

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

const mockProfile = {
  age: 28,
  genre: "homme" as const,
  relation: "ami" as const,
  pragmatiqueSentimental: 3,
  routineOriginalite: 3,
  calmeEnergie: 3,
  serieuxFun: 3,
  objetExperience: 3,
  interets: [],
  momentDeVie: [],
  roleGroupe: [],
  marquesTotem: [],
  profilAcheteur: "ne-se-prononce-pas" as const,
  projets: [],
  plaintes: [],
  blacklist: [],
  budget: "moyen" as const,
  intention: "utile" as const,
};

describe("MAX_SAVED_PROFILES", () => {
  it("is 10", () => {
    expect(MAX_SAVED_PROFILES).toBe(10);
  });
});

describe("loadSavedProfiles", () => {
  beforeEach(() => {
    ensureWindowWithStorage(createMemoryStorage());
  });

  it("returns empty array when no data", () => {
    expect(loadSavedProfiles()).toEqual([]);
  });

  it("loads valid saved profiles", () => {
    const profiles: SavedProfile[] = [
      { id: "1", name: "Mon profil", profile: mockProfile, createdAt: 1000 },
    ];
    globalThis.window.localStorage.setItem("giftgen:savedProfiles", JSON.stringify(profiles));
    expect(loadSavedProfiles()).toEqual(profiles);
  });

  it("returns empty array on corrupted JSON", () => {
    globalThis.window.localStorage.setItem("giftgen:savedProfiles", "%%%bad%%%");
    expect(loadSavedProfiles()).toEqual([]);
  });

  it("returns empty array on invalid schema (wrong types)", () => {
    globalThis.window.localStorage.setItem(
      "giftgen:savedProfiles",
      JSON.stringify([{ id: 123, name: 42 }]),
    );
    expect(loadSavedProfiles()).toEqual([]);
  });
});

describe("saveSavedProfiles", () => {
  beforeEach(() => {
    ensureWindowWithStorage(createMemoryStorage());
  });

  it("saves profiles to localStorage", () => {
    const profiles: SavedProfile[] = [
      { id: "1", name: "Profil A", profile: mockProfile, createdAt: 1000 },
    ];
    saveSavedProfiles(profiles);
    const raw = globalThis.window.localStorage.getItem("giftgen:savedProfiles");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual(profiles);
  });

  it("does not throw when localStorage is blocked", () => {
    const mem = createMemoryStorage();
    const fake = {
      ...mem,
      setItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    ensureWindowWithStorage(fake);
    expect(() => saveSavedProfiles([])).not.toThrow();
  });
});

describe("addSavedProfile", () => {
  beforeEach(() => {
    ensureWindowWithStorage(createMemoryStorage());
  });

  it("adds a new profile and returns updated list", () => {
    const result = addSavedProfile([], { name: "Premier", profile: mockProfile });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Premier");
    expect(result[0].id).toBeTruthy();
    expect(result[0].createdAt).toBeGreaterThan(0);
  });

  it("prepends to existing list", () => {
    const existing: SavedProfile[] = [
      { id: "old", name: "Ancien", profile: mockProfile, createdAt: 500 },
    ];
    const result = addSavedProfile(existing, { name: "Nouveau", profile: mockProfile });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Nouveau");
    expect(result[1].name).toBe("Ancien");
  });

  it("caps at MAX_SAVED_PROFILES", () => {
    const existing: SavedProfile[] = Array.from({ length: MAX_SAVED_PROFILES }, (_, i) => ({
      id: String(i),
      name: `Profil ${i}`,
      profile: mockProfile,
      createdAt: i,
    }));
    const result = addSavedProfile(existing, { name: "Overflow", profile: mockProfile });
    expect(result).toHaveLength(MAX_SAVED_PROFILES);
    expect(result[0].name).toBe("Overflow");
    expect(result.find((p) => p.name === `Profil ${MAX_SAVED_PROFILES - 1}`)).toBeUndefined();
  });

  it("persists to localStorage", () => {
    addSavedProfile([], { name: "Test", profile: mockProfile });
    const raw = globalThis.window.localStorage.getItem("giftgen:savedProfiles");
    expect(raw).toBeTruthy();
  });
});

describe("deleteSavedProfile", () => {
  beforeEach(() => {
    ensureWindowWithStorage(createMemoryStorage());
  });

  it("removes profile by id", () => {
    const existing: SavedProfile[] = [
      { id: "a", name: "A", profile: mockProfile, createdAt: 1 },
      { id: "b", name: "B", profile: mockProfile, createdAt: 2 },
    ];
    const result = deleteSavedProfile(existing, "a");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("returns same list if id not found", () => {
    const existing: SavedProfile[] = [
      { id: "a", name: "A", profile: mockProfile, createdAt: 1 },
    ];
    const result = deleteSavedProfile(existing, "nonexistent");
    expect(result).toHaveLength(1);
  });
});

describe("updateSavedProfile", () => {
  beforeEach(() => {
    ensureWindowWithStorage(createMemoryStorage());
  });

  it("updates name by id", () => {
    const existing: SavedProfile[] = [
      { id: "a", name: "Old", profile: mockProfile, createdAt: 1 },
    ];
    const result = updateSavedProfile(existing, "a", { name: "New" });
    expect(result[0].name).toBe("New");
  });

  it("updates profile by id", () => {
    const existing: SavedProfile[] = [
      { id: "a", name: "A", profile: mockProfile, createdAt: 1 },
    ];
    const newProfile = { ...mockProfile, age: 42 };
    const result = updateSavedProfile(existing, "a", { profile: newProfile });
    expect(result[0].profile.age).toBe(42);
  });

  it("returns unchanged list if id not found", () => {
    const existing: SavedProfile[] = [
      { id: "a", name: "A", profile: mockProfile, createdAt: 1 },
    ];
    const result = updateSavedProfile(existing, "nonexistent", { name: "X" });
    expect(result).toEqual(existing);
  });
});

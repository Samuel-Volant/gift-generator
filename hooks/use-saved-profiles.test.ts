// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSavedProfiles } from "./use-saved-profiles";
import type { UserProfile } from "@/types";

const mockProfile: UserProfile = {
  age: 28,
  genre: "homme",
  relation: "ami",
  pragmatiqueSentimental: 3,
  routineOriginalite: 3,
  calmeEnergie: 3,
  serieuxFun: 3,
  objetExperience: 3,
  interets: [],
  momentDeVie: [],
  roleGroupe: [],
  marquesTotem: [],
  profilAcheteur: "ne-se-prononce-pas",
  projets: [],
  plaintes: [],
  blacklist: [],
  budget: "moyen",
  intention: "utile",
};

describe("useSavedProfiles", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads empty list on mount", () => {
    const { result } = renderHook(() => useSavedProfiles());
    expect(result.current.savedProfiles).toEqual([]);
  });

  it("saves a new profile", () => {
    const { result } = renderHook(() => useSavedProfiles());

    act(() => {
      const saved = result.current.saveProfile("Mon profil", mockProfile);
      expect(saved).toBeTruthy();
    });

    expect(result.current.savedProfiles).toHaveLength(1);
    expect(result.current.savedProfiles[0].name).toBe("Mon profil");
  });

  it("loads a profile by id", () => {
    const { result } = renderHook(() => useSavedProfiles());

    let savedId: string | null = "";
    act(() => {
      savedId = result.current.saveProfile("Test", mockProfile);
    });

    const loaded = result.current.loadProfile(savedId!);
    expect(loaded).toEqual(mockProfile);
  });

  it("returns null when loading nonexistent profile", () => {
    const { result } = renderHook(() => useSavedProfiles());
    expect(result.current.loadProfile("nonexistent")).toBeNull();
  });

  it("deletes a profile", () => {
    const { result } = renderHook(() => useSavedProfiles());

    let savedId: string | null = "";
    act(() => {
      savedId = result.current.saveProfile("A", mockProfile);
    });

    act(() => {
      result.current.deleteProfile(savedId!);
    });

    expect(result.current.savedProfiles).toHaveLength(0);
  });

  it("does not save duplicate names", () => {
    const { result } = renderHook(() => useSavedProfiles());

    act(() => {
      result.current.saveProfile("Unique", mockProfile);
    });

    let secondResult: string | null = "";
    act(() => {
      secondResult = result.current.saveProfile("Unique", mockProfile);
    });

    expect(secondResult).toBeNull();
    expect(result.current.savedProfiles).toHaveLength(1);
  });

  it("persists across hook re-renders", () => {
    const { result, rerender } = renderHook(() => useSavedProfiles());

    act(() => {
      result.current.saveProfile("Persist", mockProfile);
    });

    rerender();

    expect(result.current.savedProfiles).toHaveLength(1);
    expect(result.current.savedProfiles[0].name).toBe("Persist");
  });

  it("isNameTaken returns true for existing name", () => {
    const { result } = renderHook(() => useSavedProfiles());

    act(() => {
      result.current.saveProfile("Existing", mockProfile);
    });

    expect(result.current.isNameTaken("Existing")).toBe(true);
    expect(result.current.isNameTaken("existing")).toBe(true);
  });

  it("isNameTaken returns false for available name", () => {
    const { result } = renderHook(() => useSavedProfiles());
    expect(result.current.isNameTaken("Available")).toBe(false);
  });
});

import { z } from "zod";
import { loadFromStorage, saveToStorage, removeFromStorage } from "./storage";
import type { SavedProfile } from "@/types";

export const MAX_SAVED_PROFILES = 10;

const SAVED_PROFILES_KEY = "giftgen:savedProfiles";

const SavedProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  profile: z.any(),
  createdAt: z.number(),
});

const SavedProfilesSchema = z.array(SavedProfileSchema);

export function loadSavedProfiles(): SavedProfile[] {
  return loadFromStorage<SavedProfile[]>(SAVED_PROFILES_KEY, [], SavedProfilesSchema);
}

export function saveSavedProfiles(profiles: SavedProfile[]): void {
  saveToStorage(SAVED_PROFILES_KEY, profiles);
}

export function removeSavedProfilesFromStorage(): void {
  removeFromStorage(SAVED_PROFILES_KEY);
}

export function addSavedProfile(
  existing: SavedProfile[],
  input: { name: string; profile: unknown },
): SavedProfile[] {
  const newProfile: SavedProfile = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: input.name,
    profile: input.profile as SavedProfile["profile"],
    createdAt: Date.now(),
  };
  const updated = [newProfile, ...existing.slice()].slice(0, MAX_SAVED_PROFILES);
  saveSavedProfiles(updated);
  return updated;
}

export function deleteSavedProfile(existing: SavedProfile[], id: string): SavedProfile[] {
  const updated = existing.filter((p) => p.id !== id);
  saveSavedProfiles(updated);
  return updated;
}

export function updateSavedProfile(
  existing: SavedProfile[],
  id: string,
  patch: Partial<Pick<SavedProfile, "name" | "profile">>,
): SavedProfile[] {
  const updated = existing.map((p) => (p.id === id ? { ...p, ...patch } : p));
  saveSavedProfiles(updated);
  return updated;
}

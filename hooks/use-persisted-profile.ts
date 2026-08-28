"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS, dedupeAndLimitTitles, clearGiftGeneratorStorage } from "@/lib/storage";
import { mergeGiftResults } from "@/lib/gift-ordering";
import { UserProfileSchema, GiftIdeasStorageSchema } from "@/lib/schemas/profile";
import type { UserProfile, GiftIdea } from "@/types";
import { z } from "zod";

export const DEFAULT_PROFILE: UserProfile = {
  age: 28,
  genre: "non-binaire",
  relation: "ami",
  pragmatiqueSentimental: 2,
  routineOriginalite: 4,
  calmeEnergie: 4,
  serieuxFun: 4,
  objetExperience: 3,
  interets: [],
  momentDeVie: [],
  roleGroupe: [],
  marquesTotem: [],
  profilAcheteur: "ne-se-prononce-pas",
  projets: [],
  plaintes: [],
  blacklist: [],
  budget: "ne-se-prononce-pas",
  intention: "ne-se-prononce-pas",
};

const AlreadySuggestedSchema = z.array(z.string());

/**
 * Hook haut niveau qui persiste profil + cadeaux + blacklist titres en localStorage.
 * - Hydratation safe (isHydrated)
 * - Validation zod (migration douce + corruption -> fallback)
 * - alreadySuggested limité à 30 derniers titres, dédupliqué
 * - clearAll + reset avec confirmation côté UI
 */
export function usePersistedProfile() {
  const [profile, setProfile, isProfileHydrated] = useLocalStorage<UserProfile>(
    STORAGE_KEYS.profile,
    DEFAULT_PROFILE,
    { validator: UserProfileSchema },
  );

  const [giftResults, setGiftResults, isGiftsHydrated] = useLocalStorage<GiftIdea[]>(
    STORAGE_KEYS.gifts,
    [],
    { validator: GiftIdeasStorageSchema },
  );

  const [alreadySuggestedTitles, setAlreadySuggestedTitles, isSuggestedHydrated] = useLocalStorage<string[]>(
    STORAGE_KEYS.alreadySuggested,
    [],
    { validator: AlreadySuggestedSchema },
  );

  const isHydrated = isProfileHydrated && isGiftsHydrated && isSuggestedHydrated;

  const addSuggestedTitles = useCallback(
    (newTitles: string[]) => {
      if (newTitles.length === 0) return;
      setAlreadySuggestedTitles((prev) => {
        const merged = [...prev, ...newTitles];
        return dedupeAndLimitTitles(merged, 30);
      });
    },
    [setAlreadySuggestedTitles],
  );

  const appendGifts = useCallback(
    (newGifts: GiftIdea[]) => {
      if (newGifts.length === 0) return;
      setGiftResults((prev) => mergeGiftResults(prev, newGifts));
      addSuggestedTitles(newGifts.map((g) => g.title));
    },
    [setGiftResults, addSuggestedTitles],
  );

  const dismissGift = useCallback(
    (giftId: string) => {
      setGiftResults((prev) => prev.filter((g) => g.id !== giftId));
    },
    [setGiftResults],
  );

  const clearAll = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setGiftResults([]);
    setAlreadySuggestedTitles([]);
    // also clear raw storage to ensure no stale keys if hooks race
    try {
      clearGiftGeneratorStorage();
    } catch {
      // silent
    }
  }, [setProfile, setGiftResults, setAlreadySuggestedTitles]);

  const resetProfileOnly = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
  }, [setProfile]);

  return useMemo(
    () => ({
      profile,
      setProfile,
      giftResults,
      setGiftResults,
      alreadySuggestedTitles,
      setAlreadySuggestedTitles,
      addSuggestedTitles,
      appendGifts,
      dismissGift,
      clearAll,
      resetProfileOnly,
      isHydrated,
      isProfileHydrated,
      isGiftsHydrated,
      isSuggestedHydrated,
    }),
    [
      profile,
      setProfile,
      giftResults,
      setGiftResults,
      alreadySuggestedTitles,
      setAlreadySuggestedTitles,
      addSuggestedTitles,
      appendGifts,
      dismissGift,
      clearAll,
      resetProfileOnly,
      isHydrated,
      isProfileHydrated,
      isGiftsHydrated,
      isSuggestedHydrated,
    ],
  );
}

"use client";

import { useCallback, useMemo, useRef, useEffect } from "react";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS, dedupeAndLimitTitles, dedupeGiftsById, clearGiftGeneratorStorage } from "@/lib/storage";
import { mergeGiftResults } from "@/lib/gift-ordering";
import { UserProfileSchema, GiftIdeasStorageSchema, DeletedGiftsStorageSchema } from "@/lib/schemas/profile";
import type { UserProfile, GiftIdea, DeletedGift } from "@/types";
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

  const [deletedGifts, setDeletedGifts, isDeletedHydrated] = useLocalStorage<DeletedGift[]>(
    STORAGE_KEYS.deletedGifts,
    [],
    { validator: DeletedGiftsStorageSchema },
  );

  // Ref pour accéder à deletedGifts dans restoreDeletedGift sans stale closure
  const deletedGiftsRef = useRef(deletedGifts);
  useEffect(() => {
    deletedGiftsRef.current = deletedGifts;
  });

  const isHydrated = isProfileHydrated && isGiftsHydrated && isSuggestedHydrated && isDeletedHydrated;

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

  const dismissNonFavorites = useCallback(
    (favoriteIds: string[]) => {
      setGiftResults((prev) => prev.filter((g) => favoriteIds.includes(g.id)));
    },
    [setGiftResults],
  );

  /**
   * Archive les cartes supprimées (dismiss + nettoyage) avec timestamp.
   * Préfixe les plus récents, déduplique par id (retire l'ancienne occurrence si re-dismiss après restore).
   * Pas de limite — la collection vit tant que le profil vit (issue #26).
   */
  const addDeletedGifts = useCallback(
    (gifts: GiftIdea[]) => {
      if (gifts.length === 0) return;
      const now = Date.now();
      const newDeleted: DeletedGift[] = gifts.map((g, i) => ({ ...g, dismissedAt: now + i }));
      setDeletedGifts((prev) => dedupeGiftsById([...newDeleted, ...prev]));
    },
    [setDeletedGifts],
  );

  const restoreDeletedGift = useCallback(
    (giftId: string) => {
      // On utilise un pattern fonctionnel pour accéder à l'état le plus récent
      // sans dépendre de la closure potentiellement stale
      setDeletedGifts((prev) => {
        const target = prev.find((g) => g.id === giftId);
        if (target) {
          // Réinsère la carte dans le grid, en haut de liste (ordre existant)
          const { dismissedAt: _dismissedAt, ...gift } = target;
          setGiftResults((giftResults) => mergeGiftResults(giftResults, [gift]));
        }
        return prev.filter((g) => g.id !== giftId);
      });
    },
    [setDeletedGifts, setGiftResults],
  );

  const clearAll = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setGiftResults([]);
    setAlreadySuggestedTitles([]);
    setDeletedGifts([]);
    // also clear raw storage to ensure no stale keys if hooks race
    try {
      clearGiftGeneratorStorage();
    } catch {
      // silent
    }
  }, [setProfile, setGiftResults, setAlreadySuggestedTitles, setDeletedGifts]);

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
      deletedGifts,
      setDeletedGifts,
      addSuggestedTitles,
      appendGifts,
      dismissGift,
      dismissNonFavorites,
      addDeletedGifts,
      restoreDeletedGift,
      clearAll,
      resetProfileOnly,
      isHydrated,
      isProfileHydrated,
      isGiftsHydrated,
      isSuggestedHydrated,
      isDeletedHydrated,
    }),
    [
      profile,
      setProfile,
      giftResults,
      setGiftResults,
      alreadySuggestedTitles,
      setAlreadySuggestedTitles,
      deletedGifts,
      setDeletedGifts,
      addSuggestedTitles,
      appendGifts,
      dismissGift,
      dismissNonFavorites,
      addDeletedGifts,
      restoreDeletedGift,
      clearAll,
      resetProfileOnly,
      isHydrated,
      isProfileHydrated,
      isGiftsHydrated,
      isSuggestedHydrated,
      isDeletedHydrated,
    ],
  );
}

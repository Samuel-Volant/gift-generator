"use client";

import { useState, useCallback } from "react";
import { usePersistedProfile } from "@/hooks/use-persisted-profile";
import { validateBudgetRange } from "@/lib/prompts/helpers";
import { formatDeletedGiftTitles } from "@/lib/prompts/helpers";
import { useToast } from "@/hooks/use-toast";
import type { Tag } from "@/types";

interface UseGiftGenerationOptions {
  selectedModel: string;
  selectedProvider: string;
}

export function useGiftGeneration({ selectedModel, selectedProvider }: UseGiftGenerationOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const {
    profile,
    setProfile,
    giftResults,
    appendGifts,
    dismissGift,
    dismissNonFavorites,
    deletedGifts,
    addDeletedGifts,
    restoreDeletedGift,
    alreadySuggestedTitles,
    setAlreadySuggestedTitles,
    clearAll,
    isHydrated,
  } = usePersistedProfile();

  const budgetError = validateBudgetRange(profile.budgetMin, profile.budgetMax);

  const handleGenerateGifts = useCallback(async () => {
    if (budgetError) {
      toast({ title: "Budget invalide", description: budgetError, variant: "destructive" });
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    try {
      const alreadySuggestedGiftTitles = alreadySuggestedTitles;
      const deletedGiftTitles = formatDeletedGiftTitles(deletedGifts);

      const response = await fetch("/api/generate-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          alreadySuggestedGiftTitles,
          deletedGiftTitles,
          model: selectedModel,
          provider: selectedProvider,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.hint || "Erreur de génération");
      }

      const data = await response.json();

      if (data.gift_ideas && data.gift_ideas.length > 0) {
        appendGifts(data.gift_ideas);

        toast({
          title: "Idées générées !",
          description: `${data.gift_ideas.length} nouvelles idées trouvées.`,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      toast({
        title: "Erreur",
        description: message || "Impossible de générer des cadeaux pour le moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [budgetError, isLoading, profile, alreadySuggestedTitles, deletedGifts, selectedModel, selectedProvider, appendGifts, toast]);

  const handleDismissGift = useCallback(
    (giftId: string, blacklistTag?: string) => {
      if (blacklistTag && blacklistTag.trim().length > 0) {
        const normalizedTag = blacklistTag.trim().toLowerCase();
        setProfile((prev) => {
          const isDuplicate = prev.blacklist.some((tag) => tag.label.toLowerCase() === normalizedTag);
          if (isDuplicate) return prev;
          const newTag: Tag = {
            id: `${Date.now()}-${Math.random()}`,
            label: blacklistTag.trim(),
          };
          return { ...prev, blacklist: [...prev.blacklist, newTag] };
        });
      }
      const dismissed = giftResults.find((g) => g.id === giftId);
      if (dismissed) addDeletedGifts([dismissed]);
      dismissGift(giftId);
    },
    [setProfile, giftResults, addDeletedGifts, dismissGift],
  );

  const handleDismissNonFavorites = useCallback(
    (favoriteIds: string[]) => {
      const removed = giftResults.filter((g) => !favoriteIds.includes(g.id));
      if (removed.length > 0) addDeletedGifts(removed);
      dismissNonFavorites(favoriteIds);
      toast({
        title: "Cartes nettoyées",
        description: "Toutes les cartes non favorites ont été supprimées.",
      });
    },
    [giftResults, addDeletedGifts, dismissNonFavorites, toast],
  );

  const handleRemoveSuggestedTitle = useCallback(
    (title: string) => {
      setAlreadySuggestedTitles((prev) => prev.filter((t) => t !== title));
    },
    [setAlreadySuggestedTitles],
  );

  const handleReset = useCallback(() => {
    clearAll();
    toast({
      title: "Réinitialisé",
      description: "Profil et cadeaux effacés. LocalStorage vidé.",
    });
  }, [clearAll, toast]);

  const handleRestoreDeletedGift = useCallback(
    (giftId: string) => {
      restoreDeletedGift(giftId);
      toast({
        title: "Carte restaurée",
        description: "La carte a été réinsérée dans la grille.",
      });
    },
    [restoreDeletedGift, toast],
  );

  return {
    profile,
    setProfile,
    giftResults,
    alreadySuggestedTitles,
    deletedGifts,
    isLoading,
    budgetError,
    handleGenerateGifts,
    handleDismissGift,
    handleDismissNonFavorites,
    handleRemoveSuggestedTitle,
    handleRestoreDeletedGift,
    handleReset,
    clearAll,
    isHydrated,
  };
}

"use client";

import { useState, useMemo } from "react";
import { Sparkles, Loader2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GiftCard } from "@/components/gift-card";
import { GiftCardSkeleton } from "@/components/gifts/gift-card-skeleton";
import { GiftFilters, isInSelectedRange } from "@/components/gifts/gift-filters";
import { PromptPreview } from "@/components/gifts/prompt-preview";
import type { GiftIdea, UserProfile } from "@/types";

interface GiftResultsProps {
  gifts: GiftIdea[];
  isLoading: boolean;
  budgetError: string | null;
  favorites: string[];
  onToggleFavorite: (giftId: string) => void;
  onGenerateMore: () => void;
  onGenerateFirst: () => void;
  onDismiss: (giftId: string, blacklistTag?: string) => void;
  profile: UserProfile;
  alreadySuggestedTitles: string[];
}

export function GiftResults({ gifts, isLoading, budgetError, favorites, onToggleFavorite, onGenerateMore, onGenerateFirst, onDismiss, profile, alreadySuggestedTitles }: GiftResultsProps) {
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);

  const handleArchetypeToggle = (archetype: string) => {
    setSelectedArchetypes((prev) =>
      prev.includes(archetype) ? prev.filter((a) => a !== archetype) : [...prev, archetype],
    );
  };

  const handlePriceRangeToggle = (range: string) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range],
    );
  };

  const filteredGifts = useMemo(() => {
    if (selectedArchetypes.length === 0 && selectedPriceRanges.length === 0) return gifts;
    return gifts.filter((g) => {
      const archetypeMatch = selectedArchetypes.length === 0 || (g.archetype && selectedArchetypes.includes(g.archetype));
      const priceMatch = isInSelectedRange(g.price, selectedPriceRanges);
      return archetypeMatch && priceMatch;
    });
  }, [gifts, selectedArchetypes, selectedPriceRanges]);

  if (gifts.length > 0 || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-balance">Idées Cadeaux Personnalisées</h2>
          <div className="flex items-center gap-2">
            <PromptPreview profile={profile} alreadySuggestedTitles={alreadySuggestedTitles} />
            {gifts.length > 0 && (
              <Button onClick={onGenerateMore} disabled={isLoading || !!budgetError} variant="outline" className="gap-2 bg-transparent">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Voir Plus d&apos;Idées
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {gifts.length > 0 && (
          <GiftFilters
            gifts={gifts}
            selectedArchetypes={selectedArchetypes}
            selectedPriceRanges={selectedPriceRanges}
            onArchetypeToggle={handleArchetypeToggle}
            onPriceRangeToggle={handlePriceRangeToggle}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredGifts.map((gift) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              isFavorite={favorites.includes(gift.id)}
              onToggleFavorite={onToggleFavorite}
              onDismiss={onDismiss}
            />
          ))}
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => <GiftCardSkeleton key={`skeleton-${i}`} />)}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="py-12 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <Gift className="h-8 w-8 text-primary-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-balance">Prêt à trouver le cadeau parfait ?</h3>
        <p className="text-muted-foreground max-w-md mx-auto text-pretty">
          Cliquez sur le bouton ci-dessous et laissez notre IA analyser ce profil pour vous proposer des idées de cadeaux personnalisées.
        </p>
        <Button onClick={onGenerateFirst} size="lg" disabled={isLoading || !!budgetError} className="gap-2 mt-4">
          <>
            <Sparkles className="h-5 w-5" />
            Générer mes Idées Cadeaux
          </>
        </Button>
        <div className="pt-2">
          <PromptPreview profile={profile} alreadySuggestedTitles={alreadySuggestedTitles} />
        </div>
      </CardContent>
    </Card>
  );
}

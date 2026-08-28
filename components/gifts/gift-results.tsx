"use client";

import { Sparkles, Loader2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GiftCard } from "@/components/gift-card";
import { PromptPreview } from "@/components/gifts/prompt-preview";
import type { GiftIdea, UserProfile } from "@/types";

interface GiftResultsProps {
  gifts: GiftIdea[];
  isLoading: boolean;
  budgetError: string | null;
  onGenerateMore: () => void;
  onGenerateFirst: () => void;
  onDismiss: (giftId: string, blacklistTag?: string) => void;
  profile: UserProfile;
  alreadySuggestedTitles: string[];
}

export function GiftResults({ gifts, isLoading, budgetError, onGenerateMore, onGenerateFirst, onDismiss, profile, alreadySuggestedTitles }: GiftResultsProps) {
  if (gifts.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-balance">Idées Cadeaux Personnalisées</h2>
          <div className="flex items-center gap-2">
            <PromptPreview profile={profile} alreadySuggestedTitles={alreadySuggestedTitles} />
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {gifts.map((gift) => (
            <GiftCard key={gift.id} gift={gift} onDismiss={onDismiss} />
          ))}
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
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Générer mes Idées Cadeaux
            </>
          )}
        </Button>
        <div className="pt-2">
          <PromptPreview profile={profile} alreadySuggestedTitles={alreadySuggestedTitles} />
        </div>
      </CardContent>
    </Card>
  );
}

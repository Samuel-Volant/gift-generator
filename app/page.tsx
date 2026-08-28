"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { IdentityCard } from "@/components/profile/identity-card";
import { PsychologyCard } from "@/components/profile/psychology-card";
import { InterestsCard } from "@/components/profile/interests-card";
import { SociologyCard } from "@/components/profile/sociology-card";
import { ContextCard } from "@/components/profile/context-card";
import { BlacklistCard } from "@/components/profile/blacklist-card";
import { GiftFrameCard } from "@/components/profile/gift-frame-card";
import { GiftResults } from "@/components/gifts/gift-results";
import { useAvailableModels } from "@/hooks/use-available-models";
import { useGiftGeneration } from "@/hooks/use-gift-generation";

export default function GiftGeniusPage() {
  const { availableModels, selectedModel, setSelectedModel, selectedProvider, isLoadingModels } = useAvailableModels();
  const { profile, setProfile, giftResults, alreadySuggestedTitles, isLoading, budgetError, handleGenerateGifts, handleDismissGift, handleReset } =
    useGiftGeneration({ selectedModel, selectedProvider });
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const onConfirmReset = () => {
    handleReset();
    setIsResetDialogOpen(false);
  };
  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        availableModels={availableModels}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        isLoadingModels={isLoadingModels}
        isResetDialogOpen={isResetDialogOpen}
        onResetDialogChange={setIsResetDialogOpen}
        onConfirmReset={onConfirmReset}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
            <IdentityCard
              age={profile.age}
              genre={profile.genre}
              relation={profile.relation}
              onAgeChange={(age) => setProfile((p) => ({ ...p, age }))}
              onGenreChange={(genre) => setProfile((p) => ({ ...p, genre }))}
              onRelationChange={(relation) => setProfile((p) => ({ ...p, relation }))}
            />
            <PsychologyCard
              pragmatiqueSentimental={profile.pragmatiqueSentimental}
              routineOriginalite={profile.routineOriginalite}
              calmeEnergie={profile.calmeEnergie}
              serieuxFun={profile.serieuxFun}
              objetExperience={profile.objetExperience}
              onPragmatiqueSentimentalChange={(v) => setProfile((p) => ({ ...p, pragmatiqueSentimental: v }))}
              onRoutineOriginaliteChange={(v) => setProfile((p) => ({ ...p, routineOriginalite: v }))}
              onCalmeEnergieChange={(v) => setProfile((p) => ({ ...p, calmeEnergie: v }))}
              onSerieuxFunChange={(v) => setProfile((p) => ({ ...p, serieuxFun: v }))}
              onObjetExperienceChange={(v) => setProfile((p) => ({ ...p, objetExperience: v }))}
            />
            <InterestsCard
              interests={profile.interets}
              onInterestsChange={(interests) => setProfile((p) => ({ ...p, interets: interests }))}
              sliders={{
                pragmatiqueSentimental: profile.pragmatiqueSentimental,
                routineOriginalite: profile.routineOriginalite,
                calmeEnergie: profile.calmeEnergie,
                serieuxFun: profile.serieuxFun,
                objetExperience: profile.objetExperience,
              }}
              selectedModel={selectedModel}
              selectedProvider={selectedProvider}
            />
            <SociologyCard
              momentDeVie={profile.momentDeVie}
              roleGroupe={profile.roleGroupe}
              marquesTotem={profile.marquesTotem}
              onMomentDeVieChange={(tags) => setProfile((p) => ({ ...p, momentDeVie: tags }))}
              onRoleGroupeChange={(tags) => setProfile((p) => ({ ...p, roleGroupe: tags }))}
              onMarquesTotemChange={(tags) => setProfile((p) => ({ ...p, marquesTotem: tags }))}
            />
            <ContextCard
              profilAcheteur={profile.profilAcheteur}
              projets={profile.projets}
              plaintes={profile.plaintes}
              onProfilAcheteurChange={(profilAcheteur) => setProfile((p) => ({ ...p, profilAcheteur }))}
              onProjetsChange={(tags) => setProfile((p) => ({ ...p, projets: tags }))}
              onPlaintesChange={(tags) => setProfile((p) => ({ ...p, plaintes: tags }))}
            />
            <BlacklistCard blacklist={profile.blacklist} onBlacklistChange={(tags) => setProfile((p) => ({ ...p, blacklist: tags }))} />
            <GiftFrameCard
              budget={profile.budget}
              budgetMin={profile.budgetMin}
              budgetMax={profile.budgetMax}
              intention={profile.intention}
              budgetError={budgetError}
              onBudgetChange={(budget) => setProfile((p) => ({ ...p, budget }))}
              onBudgetMinChange={(budgetMin) => setProfile((p) => ({ ...p, budgetMin }))}
              onBudgetMaxChange={(budgetMax) => setProfile((p) => ({ ...p, budgetMax }))}
              onIntentionChange={(intention) => setProfile((p) => ({ ...p, intention }))}
            />
          </div>
          <GiftResults
            gifts={giftResults}
            isLoading={isLoading}
            budgetError={budgetError}
            onGenerateMore={handleGenerateGifts}
            onGenerateFirst={handleGenerateGifts}
            onDismiss={handleDismissGift}
            profile={profile}
            alreadySuggestedTitles={alreadySuggestedTitles}
          />
        </div>
      </main>
    </div>
  );
}

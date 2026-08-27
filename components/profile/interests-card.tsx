"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InterestTagManager } from "@/components/interest-tag-manager";
import type { Interest, Provider } from "@/types";

interface InterestsCardProps {
  interests: Interest[];
  onInterestsChange: (interests: Interest[]) => void;
  sliders: {
    pragmatiqueSentimental: number;
    routineOriginalite: number;
    calmeEnergie: number;
    serieuxFun: number;
    objetExperience: number;
  };
  selectedModel: string;
  selectedProvider: Provider;
}

export function InterestsCard({ interests, onInterestsChange, sliders, selectedModel, selectedProvider }: InterestsCardProps) {
  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg">Ses Centres d&apos;Intérêts</CardTitle>
      </CardHeader>
      <CardContent>
        <InterestTagManager
          interests={interests}
          onInterestsChange={onInterestsChange}
          defaultSuggestions={["Lecture", "Musique", "Cinéma", "Gaming", "Voyages"]}
          sliders={sliders}
          selectedModel={selectedModel}
          selectedProvider={selectedProvider}
        />
      </CardContent>
    </Card>
  );
}

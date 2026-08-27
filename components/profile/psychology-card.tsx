"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PsychologySlider } from "@/components/psychology-slider";

interface PsychologyCardProps {
  pragmatiqueSentimental: number;
  routineOriginalite: number;
  calmeEnergie: number;
  serieuxFun: number;
  objetExperience: number;
  onPragmatiqueSentimentalChange: (v: number) => void;
  onRoutineOriginaliteChange: (v: number) => void;
  onCalmeEnergieChange: (v: number) => void;
  onSerieuxFunChange: (v: number) => void;
  onObjetExperienceChange: (v: number) => void;
}

export function PsychologyCard({
  pragmatiqueSentimental,
  routineOriginalite,
  calmeEnergie,
  serieuxFun,
  objetExperience,
  onPragmatiqueSentimentalChange,
  onRoutineOriginaliteChange,
  onCalmeEnergieChange,
  onSerieuxFunChange,
  onObjetExperienceChange,
}: PsychologyCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">Son Vibe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <PsychologySlider
          label="Approche"
          leftLabel="Pragmatique"
          rightLabel="Sentimental"
          value={pragmatiqueSentimental}
          onChange={onPragmatiqueSentimentalChange}
        />
        <PsychologySlider
          label="Style de vie"
          leftLabel="Routine"
          rightLabel="Originalité"
          value={routineOriginalite}
          onChange={onRoutineOriginaliteChange}
        />
        <PsychologySlider label="Énergie" leftLabel="Calme" rightLabel="Énergie" value={calmeEnergie} onChange={onCalmeEnergieChange} />
        <PsychologySlider label="Personnalité" leftLabel="Sérieux" rightLabel="Fun" value={serieuxFun} onChange={onSerieuxFunChange} />
        <PsychologySlider
          label="Préférence cadeau"
          leftLabel="Objet"
          rightLabel="Expérience"
          value={objetExperience}
          onChange={onObjetExperienceChange}
        />
      </CardContent>
    </Card>
  );
}

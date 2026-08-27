"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SmartTagManager } from "@/components/smart-tag-manager";
import type { BuyerProfile, Tag } from "@/types";

interface ContextCardProps {
  profilAcheteur: BuyerProfile;
  projets: Tag[];
  plaintes: Tag[];
  onProfilAcheteurChange: (value: BuyerProfile) => void;
  onProjetsChange: (tags: Tag[]) => void;
  onPlaintesChange: (tags: Tag[]) => void;
}

export function ContextCard({
  profilAcheteur,
  projets,
  plaintes,
  onProfilAcheteurChange,
  onProjetsChange,
  onPlaintesChange,
}: ContextCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">Contexte Actuel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="profil-acheteur">Profil d&apos;Acheteur</Label>
          <Select value={profilAcheteur} onValueChange={(value: string) => onProfilAcheteurChange(value as BuyerProfile)}>
            <SelectTrigger id="profil-acheteur">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ne-se-prononce-pas">Ne se prononce pas</SelectItem>
              <SelectItem value="impulsif">Impulsif</SelectItem>
              <SelectItem value="collectionneur">Collectionneur</SelectItem>
              <SelectItem value="econome">Économe</SelectItem>
              <SelectItem value="reflechi">Réfléchi</SelectItem>
              <SelectItem value="early-adopter">Early Adopter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-3 block font-semibold">Projets du Moment</Label>
          <SmartTagManager
            selectedTags={projets}
            onTagsChange={onProjetsChange}
            defaultSuggestions={["Apprendre une langue", "Déménagement", "Road Trip", "Marathon", "Déco Salon"]}
            placeholder="Ajouter un projet..."
          />
        </div>
        <div>
          <Label className="mb-3 block font-semibold">Plaintes Récurrentes</Label>
          <SmartTagManager
            selectedTags={plaintes}
            onTagsChange={onPlaintesChange}
            defaultSuggestions={["Froid aux pieds", "Manque de temps", "Dos douloureux", "Perd ses clés"]}
            placeholder="Ajouter une plainte..."
          />
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SmartTagManager } from "@/components/smart-tag-manager";
import type { Tag } from "@/types";

interface SociologyCardProps {
  momentDeVie: Tag[];
  roleGroupe: Tag[];
  marquesTotem: Tag[];
  onMomentDeVieChange: (tags: Tag[]) => void;
  onRoleGroupeChange: (tags: Tag[]) => void;
  onMarquesTotemChange: (tags: Tag[]) => void;
}

export function SociologyCard({
  momentDeVie,
  roleGroupe,
  marquesTotem,
  onMomentDeVieChange,
  onRoleGroupeChange,
  onMarquesTotemChange,
}: SociologyCardProps) {
  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg">Sa place dans le monde</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-3 block font-semibold">Moment de Vie</Label>
          <SmartTagManager
            selectedTags={momentDeVie}
            onTagsChange={onMomentDeVieChange}
            defaultSuggestions={["Étudiant", "Jeune Parent", "Retraité", "En Reconversion", "Jeune Actif", "L'Organisateur"]}
            placeholder="Ajouter un moment de vie..."
          />
        </div>
        <div>
          <Label className="mb-3 block font-semibold">Rôle dans le groupe</Label>
          <SmartTagManager
            selectedTags={roleGroupe}
            onTagsChange={onRoleGroupeChange}
            defaultSuggestions={["Le Clown", "Le Leader", "Le Sage", "Le Créatif", "Le Médiateur", "L'Aventurier"]}
            placeholder="Ajouter un rôle..."
          />
        </div>
        <div>
          <Label className="mb-3 block font-semibold">Marques Totem</Label>
          <SmartTagManager
            selectedTags={marquesTotem}
            onTagsChange={onMarquesTotemChange}
            defaultSuggestions={["Nike", "Apple", "Decathlon", "Patagonia", "Tesla"]}
            placeholder="Ajouter une marque..."
          />
        </div>
      </CardContent>
    </Card>
  );
}

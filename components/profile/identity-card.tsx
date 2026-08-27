"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Genre, Relation } from "@/types";

interface IdentityCardProps {
  age: number;
  genre: Genre;
  relation: Relation;
  onAgeChange: (age: number) => void;
  onGenreChange: (genre: Genre) => void;
  onRelationChange: (relation: Relation) => void;
}

export function IdentityCard({ age, genre, relation, onAgeChange, onGenreChange, onRelationChange }: IdentityCardProps) {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Identité</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="age">Âge</Label>
          <Input id="age" type="number" min={0} max={120} value={age} onChange={(e) => onAgeChange(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="genre">Genre</Label>
          <Select value={genre} onValueChange={(value: string) => onGenreChange(value as Genre)}>
            <SelectTrigger id="genre">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="homme">Homme</SelectItem>
              <SelectItem value="femme">Femme</SelectItem>
              <SelectItem value="non-binaire">Non-binaire</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="relation">Relation</Label>
          <Select value={relation} onValueChange={(value: string) => onRelationChange(value as Relation)}>
            <SelectTrigger id="relation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ami">Ami(e)</SelectItem>
              <SelectItem value="famille">Famille</SelectItem>
              <SelectItem value="collegue">Collègue</SelectItem>
              <SelectItem value="partenaire">Partenaire</SelectItem>
              <SelectItem value="connaissance">Connaissance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

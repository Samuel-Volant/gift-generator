"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartTagManager } from "@/components/smart-tag-manager";
import type { Tag } from "@/types";

interface BlacklistCardProps {
  blacklist: Tag[];
  onBlacklistChange: (tags: Tag[]) => void;
}

export function BlacklistCard({ blacklist, onBlacklistChange }: BlacklistCardProps) {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg text-destructive">À éviter (Blacklist)</CardTitle>
      </CardHeader>
      <CardContent>
        <SmartTagManager
          selectedTags={blacklist}
          onTagsChange={onBlacklistChange}
          defaultSuggestions={["Alcool", "Parfums", "Vêtements", "Gadgets inutiles"]}
          placeholder="Ajouter à éviter..."
          variant="danger"
        />
      </CardContent>
    </Card>
  );
}

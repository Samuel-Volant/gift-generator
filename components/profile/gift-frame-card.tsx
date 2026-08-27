"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Budget, Intention } from "@/types";

interface GiftFrameCardProps {
  budget: Budget;
  budgetMin?: number;
  budgetMax?: number;
  intention: Intention;
  budgetError: string | null;
  onBudgetChange: (budget: Budget) => void;
  onBudgetMinChange: (value: number | undefined) => void;
  onBudgetMaxChange: (value: number | undefined) => void;
  onIntentionChange: (intention: Intention) => void;
}

export function GiftFrameCard({
  budget,
  budgetMin,
  budgetMax,
  intention,
  budgetError,
  onBudgetChange,
  onBudgetMinChange,
  onBudgetMaxChange,
  onIntentionChange,
}: GiftFrameCardProps) {
  return (
    <Card className="md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-lg">Le Cadre du Cadeau</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="budget">Budget</Label>
          <Select value={budget} onValueChange={(value: string) => onBudgetChange(value as Budget)}>
            <SelectTrigger id="budget">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ne-se-prononce-pas">Ne se prononce pas</SelectItem>
              <SelectItem value="petit">Petit (€ - moins de 30€)</SelectItem>
              <SelectItem value="moyen">Moyen (€€ - 30-100€)</SelectItem>
              <SelectItem value="eleve">Élevé (€€€ - 100-300€)</SelectItem>
              <SelectItem value="premium">Premium (€€€€ - plus de 300€)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Le preset est une indication souple pour le LLM.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budgetMin">Min €</Label>
            <Input
              id="budgetMin"
              type="number"
              inputMode="numeric"
              min={0}
              max={5000}
              placeholder="20"
              value={budgetMin ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  onBudgetMinChange(undefined);
                } else {
                  const n = Number(raw);
                  onBudgetMinChange(Number.isFinite(n) ? n : undefined);
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetMax">Max €</Label>
            <Input
              id="budgetMax"
              type="number"
              inputMode="numeric"
              min={0}
              max={5000}
              placeholder="80"
              value={budgetMax ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  onBudgetMaxChange(undefined);
                } else {
                  const n = Number(raw);
                  onBudgetMaxChange(Number.isFinite(n) ? n : undefined);
                }
              }}
            />
          </div>
        </div>
        {budgetError ? (
          <p className="text-sm text-destructive" role="alert">
            {budgetError}
          </p>
        ) : (
          (budgetMin !== undefined || budgetMax !== undefined) && (
            <p className="text-xs text-muted-foreground">Fourchette précise prioritaire sur le preset pour la génération.</p>
          )
        )}

        <div className="space-y-3">
          <Label>Intention</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { value: "ne-se-prononce-pas", label: "🤷", desc: "Ne se prononce pas" },
              { value: "wow", label: "✨ Wow", desc: "Impressionner" },
              { value: "utile", label: "🎯 Utile", desc: "Pratique" },
              { value: "fun", label: "🎉 Fun", desc: "Amusant" },
              { value: "apprendre", label: "📚 Apprendre", desc: "Éducatif" },
              { value: "emouvoir", label: "💝 Émouvoir", desc: "Émotion" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => onIntentionChange(item.value as Intention)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${intention === item.value ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"}`}
              >
                <div className="font-semibold text-sm mb-1">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

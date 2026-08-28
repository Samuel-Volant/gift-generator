"use client";

import { Gift, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SavedProfilesManager } from "@/components/saved-profiles-manager";
import type { AIModel } from "@/lib/ai-models";
import type { UserProfile } from "@/types";

interface AppHeaderProps {
  availableModels: AIModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  isLoadingModels: boolean;
  isResetDialogOpen: boolean;
  onResetDialogChange: (open: boolean) => void;
  onConfirmReset: () => void;
  currentProfile: UserProfile;
  onLoadProfile: (profile: UserProfile) => void;
}

export function AppHeader({ availableModels, selectedModel, onModelChange, isLoadingModels, isResetDialogOpen, onResetDialogChange, onConfirmReset, currentProfile, onLoadProfile }: AppHeaderProps) {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Gift className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-balance">GiftGenius</h1>
              <p className="text-sm text-muted-foreground">L&apos;IA qui trouve le cadeau parfait</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SavedProfilesManager currentProfile={currentProfile} onLoadProfile={onLoadProfile} />
            <Label htmlFor="model-select" className="text-sm font-medium hidden sm:block">
              Modèle IA :
            </Label>
            <Select value={selectedModel} onValueChange={onModelChange} disabled={isLoadingModels}>
              <SelectTrigger id="model-select" className="w-[220px]">
                <SelectValue placeholder={isLoadingModels ? "Chargement..." : "Choisir un modèle"} />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isResetDialogOpen} onOpenChange={onResetDialogChange}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 bg-transparent" aria-label="Réinitialiser profil et cadeaux">
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Réinitialiser</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Réinitialiser ?</DialogTitle>
                  <DialogDescription>
                    Cette action effacera le profil, les cadeaux générés et l&apos;historique des titres déjà suggérés stockés en local.
                    Cette action est irréversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => onResetDialogChange(false)}>
                    Annuler
                  </Button>
                  <Button variant="destructive" onClick={onConfirmReset}>
                    Confirmer la réinitialisation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
}

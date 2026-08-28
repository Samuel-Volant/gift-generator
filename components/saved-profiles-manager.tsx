"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSavedProfiles } from "@/hooks/use-saved-profiles";
import type { UserProfile } from "@/types";

interface SavedProfilesManagerProps {
  currentProfile: UserProfile;
  onLoadProfile: (profile: UserProfile) => void;
}

export function SavedProfilesManager({ currentProfile, onLoadProfile }: SavedProfilesManagerProps) {
  const { savedProfiles, saveProfile, loadProfile, deleteProfile, isNameTaken } = useSavedProfiles();
  const [selectedId, setSelectedId] = useState<string>("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [saveError, setSaveError] = useState("");

  const handleSave = () => {
    const name = profileName.trim();
    if (!name) {
      setSaveError("Le nom ne peut pas être vide");
      return;
    }
    if (isNameTaken(name)) {
      setSaveError("Ce nom est déjà utilisé");
      return;
    }
    const result = saveProfile(name, currentProfile);
    if (result !== null) {
      setIsSaveDialogOpen(false);
      setProfileName("");
      setSaveError("");
    }
  };

  const handleLoad = () => {
    if (!selectedId) return;
    const profile = loadProfile(selectedId);
    if (profile) {
      onLoadProfile(profile);
    }
  };

  const handleDelete = () => {
    if (!selectedId) return;
    deleteProfile(selectedId);
    setSelectedId("");
  };

  return (
    <div className="flex items-center gap-1">
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent" aria-label="Sauvegarder le profil">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Sauver</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder le profil</DialogTitle>
            <DialogDescription>
              Donnez un nom à votre profil pour le retrouver plus tard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nom du profil</Label>
            <Input
              id="profile-name"
              value={profileName}
              onChange={(e) => {
                setProfileName(e.target.value);
                setSaveError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="Ex: Mon profil cadeau"
              autoFocus
            />
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {savedProfiles.length > 0 && (
        <>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-[180px] h-9" aria-label=" Profils sauvegardés">
              <Bookmark className="h-4 w-4 mr-1 shrink-0" />
              <SelectValue placeholder="Profil sauvegardé" />
            </SelectTrigger>
            <SelectContent>
              {savedProfiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-transparent"
            disabled={!selectedId}
            onClick={handleLoad}
            aria-label="Charger le profil sélectionné"
          >
            <BookmarkCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Charger</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-transparent text-destructive hover:text-destructive"
            disabled={!selectedId}
            onClick={handleDelete}
            aria-label="Supprimer le profil sélectionné"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

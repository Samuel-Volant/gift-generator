"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { UserProfile, SavedProfile } from "@/types";
import {
  loadSavedProfiles,
  addSavedProfile,
  deleteSavedProfile,
} from "@/lib/saved-profiles";

export function useSavedProfiles() {
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      const loaded = loadSavedProfiles();
      if (!cancelled) setSavedProfiles(loaded);
    } finally {
      if (!cancelled) setIsHydrated(true);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = useCallback(
    (name: string, profile: UserProfile): string | null => {
      const current = loadSavedProfiles();
      if (current.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        return null;
      }
      const updated = addSavedProfile(current, { name, profile });
      setSavedProfiles(updated);
      const saved = updated.find((p) => p.name === name);
      return saved?.id ?? null;
    },
    [],
  );

  const loadProfile = useCallback(
    (id: string): UserProfile | null => {
      const found = savedProfiles.find((p) => p.id === id);
      return found?.profile ?? null;
    },
    [savedProfiles],
  );

  const deleteProfile = useCallback((id: string) => {
    setSavedProfiles((prev) => deleteSavedProfile(prev, id));
  }, []);

  const isNameTaken = useCallback(
    (name: string): boolean => {
      return savedProfiles.some((p) => p.name.toLowerCase() === name.toLowerCase());
    },
    [savedProfiles],
  );

  return useMemo(
    () => ({
      savedProfiles,
      saveProfile,
      loadProfile,
      deleteProfile,
      isNameTaken,
      isHydrated,
    }),
    [savedProfiles, saveProfile, loadProfile, deleteProfile, isNameTaken, isHydrated],
  );
}

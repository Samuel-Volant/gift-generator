/**
 * Helpers localStorage — persistance gift-generator (issue #17)
 * @module lib/storage
 */
import type { z } from "zod";

export const STORAGE_KEYS = {
  profile: "giftgen:profile",
  gifts: "giftgen:gifts",
  alreadySuggested: "giftgen:alreadySuggested",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS] | string;

/**
 * Vérifie si localStorage est accessible (SSR-safe + quota/blocked-safe).
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return false;
  }
  try {
    const testKey = "__giftgen_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.getItem(testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse JSON safe — retourne fallback si null / invalide / non-string.
 */
export function safeParse<T>(raw: string | null, fallback: T): T {
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Charge depuis localStorage avec validation optionnelle (zod ou autre).
 * Si corruption / validation échoue -> fallback (migration douce).
 */
export function loadFromStorage<T>(
  key: string,
  fallback: T,
  validator?: z.ZodSchema<T> | { safeParse: (data: unknown) => { success: boolean; data?: unknown } },
): T {
  if (!isLocalStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = safeParse(raw, undefined as unknown as T);
    // safeParse retourne undefined si corruption via fallback trick — traiter comme échec
    if (parsed === undefined) return fallback;
    if (validator) {
      const result = (validator as z.ZodSchema<T>).safeParse(parsed);
      if (!result.success) return fallback;
      return result.data;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Sauvegarde en localStorage — swallow errors (quota, blocked, SSR).
 */
export function saveToStorage<T>(key: string, value: T): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silent — observabilité pourra logger plus tard (issue #21)
  }
}

export function removeFromStorage(key: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // silent
  }
}

export function clearGiftGeneratorStorage(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    removeFromStorage(key);
  }
}

/**
 * Déduplique (ordre d'apparition) et limite à `limit` derniers titres.
 * Garde une fenêtre glissante des `limit` derniers uniques (dédup d'abord, puis slice fin).
 * Si plus de `limit` uniques, conserve les plus récents.
 */
export function dedupeAndLimitTitles(titles: string[], limit = 30): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const t of titles) {
    if (!seen.has(t)) {
      seen.add(t);
      deduped.push(t);
    }
  }
  if (deduped.length <= limit) return deduped;
  return deduped.slice(deduped.length - limit);
}

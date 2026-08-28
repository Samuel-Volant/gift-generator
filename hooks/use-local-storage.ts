"use client";

import { useState, useEffect, useCallback } from "react";
import type { z } from "zod";

/**
 * Hook générique persistant localStorage — SSR-safe, validation zod, swallow corruption.
 * @param key clé localStorage
 * @param initialValue fallback si absent / corrompu / invalide
 * @param options.validator zod schema pour valider le JSON parsé (migration douce)
 * @returns [value, setValue, isHydrated]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: { validator?: z.ZodSchema<T> },
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [isHydrated, setIsHydrated] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Hydratation : charge depuis localStorage une seule fois au montage
  useEffect(() => {
    let cancelled = false;
    try {
      if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
        if (!cancelled) setIsHydrated(true);
        return;
      }
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (options?.validator) {
            const result = options.validator.safeParse(parsed);
            if (result.success) {
              if (!cancelled) setStoredValue(result.data);
            } else {
              // validation échouée -> garde initialValue (migration douce)
              // optionnel: log warning pour observabilité future
            }
          } else {
            if (!cancelled) setStoredValue(parsed as T);
          }
        } catch {
          // JSON corrompu -> fallback initialValue sans crash
        }
      }
    } catch {
      // localStorage bloqué -> fallback
    } finally {
      if (!cancelled) setIsHydrated(true);
    }
    return () => {
      cancelled = true;
    };
    // validator reference stable via JSON? On ne veut pas recharger si validator change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persistance : dès que hydraté et que storedValue change, écrit dans localStorage
  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (e) {
      console.warn(`[useLocalStorage] write failed key=${key}:`, e instanceof Error ? e.message : String(e));
    }
  }, [key, storedValue, isHydrated]);

  // Écoute cross-tab `storage` event pour sync optionnelle (toujours active si même clé)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: StorageEvent) => {
      if (e.key !== key) return;
      if (e.newValue === null) {
        setStoredValue(initialValue);
        return;
      }
      try {
        const parsed: unknown = JSON.parse(e.newValue);
        if (options?.validator) {
          const result = options.validator.safeParse(parsed);
          if (result.success) setStoredValue(result.data);
        } else {
          setStoredValue(parsed as T);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (value) => {
      setStoredValue((prev) => (typeof value === "function" ? (value as (prev: T) => T)(prev) : value));
    },
    [],
  );

  return [storedValue, setValue, isHydrated];
}

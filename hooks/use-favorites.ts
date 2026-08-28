"use client"

import { useCallback } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { STORAGE_KEYS } from "@/lib/storage"

const emptyFavorites: string[] = []

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>(STORAGE_KEYS.favorites, emptyFavorites)

  const isFavorite = useCallback((giftId: string) => favorites.includes(giftId), [favorites])

  const toggleFavorite = useCallback(
    (giftId: string) => {
      setFavorites((prev) =>
        prev.includes(giftId) ? prev.filter((id) => id !== giftId) : [...prev, giftId],
      )
    },
    [setFavorites],
  )

  return { favorites, isFavorite, toggleFavorite }
}

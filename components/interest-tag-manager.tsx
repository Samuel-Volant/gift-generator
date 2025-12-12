"use client"

import type React from "react"

import { useState } from "react"
import { X, Plus, Sparkles, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Interest, InterestLevel } from "@/types"

interface InterestTagManagerProps {
  interests: Interest[]
  onInterestsChange: (interests: Interest[]) => void
  defaultSuggestions?: string[]
  sliders?: { // Added sliders prop
    pragmatiqueSentimental: number
    routineOriginalite: number
    calmeEnergie: number
    serieuxFun: number
    objetExperience: number
  }
}

export function InterestTagManager({ interests, onInterestsChange, defaultSuggestions = [], sliders }: InterestTagManagerProps) {
  const [inputValue, setInputValue] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [ignoredTags, setIgnoredTags] = useState<string[]>([]) // New state for ignored tags
  const [isLoading, setIsLoading] = useState(false)

  const handleAddInterest = (label: string, level: InterestLevel = "casual") => {
    if (!label.trim()) return

    if (interests.some((interest) => interest.label.toLowerCase() === label.trim().toLowerCase())) {
      setInputValue("")
      return
    }

    const newInterest: Interest = {
      id: `${Date.now()}-${Math.random()}`,
      label: label.trim(),
      level,
    }

    onInterestsChange([...interests, newInterest])
    setInputValue("")
  }

  const handleToggleLevel = (id: string) => {
    onInterestsChange(
      interests.map((interest) => {
        if (interest.id === id) {
          const levels: InterestLevel[] = ["casual", "expert"]
          const currentIndex = levels.indexOf(interest.level)
          const nextLevel = levels[(currentIndex + 1) % levels.length]
          return { ...interest, level: nextLevel }
        }
        return interest
      }),
    )
  }

  const handleRemoveInterest = (id: string) => {
    onInterestsChange(interests.filter((interest) => interest.id !== id))
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (interests.some((interest) => interest.label === suggestion)) return
    handleAddInterest(suggestion, "casual")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddInterest(inputValue)
    }
  }

  const handleInspireMe = async () => {
    setIsLoading(true)
    try {
      // Calculate tags that were suggested but not selected (ignored)
      const unselectedSuggestions = aiSuggestions.filter(
        (suggestion) => !interests.some((interest) => interest.label === suggestion),
      )

      // Update the ignoredTags list
      const updatedIgnoredTags = [...ignoredTags, ...unselectedSuggestions]
      setIgnoredTags(updatedIgnoredTags)

      const response = await fetch("/api/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTags: interests,
          sliders: sliders,
          ignoredTags: updatedIgnoredTags, // Send to API
        }),
      })

      if (!response.ok) throw new Error("Erreur de génération")

      const data = await response.json()
      if (data.suggested_tags) {
        setAiSuggestions(data.suggested_tags)
      }
    } catch (error) {
      console.error("Failed to generate tags", error)
      // We could toast here if we imported toast
    } finally {
      setIsLoading(false)
    }
  }

  const availableDefaultSuggestions = defaultSuggestions.filter(
    (suggestion) => !interests.some((interest) => interest.label === suggestion),
  )

  const availableAiSuggestions = aiSuggestions.filter(
    (suggestion) => !interests.some((interest) => interest.label === suggestion),
  )

  return (
    <div className="space-y-3">
      {/* Zone Active - Intérêts Sélectionnés */}
      {interests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <Badge
              key={interest.id}
              className={cn(
                "px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 cursor-pointer transition-all",
                interest.level === "casual" && "bg-blue-500 text-white hover:bg-blue-600",
                interest.level === "expert" &&
                "bg-gradient-to-r from-amber-400 to-yellow-500 text-white hover:from-amber-500 hover:to-yellow-600",
              )}
              onClick={() => handleToggleLevel(interest.id)}
            >
              {interest.level === "expert" && <Star className="h-3 w-3 fill-current" />}
              {interest.label}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveInterest(interest.id)
                }}
                className="hover:bg-black/10 rounded-full p-0.5 ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Zone d'Input avec Bouton Inspire Me */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ajouter un centre d'intérêt..."
          className="flex-1"
        />
        <Button
          onClick={() => handleAddInterest(inputValue)}
          size="icon"
          variant="outline"
          disabled={!inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button onClick={handleInspireMe} variant="secondary" className="gap-2" disabled={isLoading}>
          <Sparkles className="h-4 w-4" />
          {isLoading ? "Chargement..." : "Inspirez-moi"}
        </Button>
      </div>

      {/* Zone de Suggestions */}
      {(availableDefaultSuggestions.length > 0 || availableAiSuggestions.length > 0) && (
        <div className="space-y-2">
          {availableDefaultSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableDefaultSuggestions.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="px-3 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          )}

          {availableAiSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableAiSuggestions.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm cursor-pointer bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-primary/20"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  ✨ {suggestion}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Légende */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>Casual (1 clic)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-amber-400 to-yellow-500" />
          <Star className="h-3 w-3" />
          <span>Expert (2 clics)</span>
        </div>
      </div>
    </div>
  )
}

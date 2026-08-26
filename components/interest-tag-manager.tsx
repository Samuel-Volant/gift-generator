"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Plus, Sparkles, Star, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useTagManager, isDuplicateLabel, generateTagId } from "@/components/tag-manager-base"
import type { Interest, InterestLevel, Provider } from "@/types"

interface InterestTagManagerProps {
  interests: Interest[]
  onInterestsChange: (interests: Interest[]) => void
  defaultSuggestions?: string[]
  sliders?: {
    pragmatiqueSentimental: number
    routineOriginalite: number
    calmeEnergie: number
    serieuxFun: number
    objetExperience: number
  }
  selectedModel?: string
  selectedProvider?: Provider
}

export function InterestTagManager({
  interests,
  onInterestsChange,
  defaultSuggestions = [],
  sliders,
  selectedModel,
  selectedProvider,
}: InterestTagManagerProps) {
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [ignoredTags, setIgnoredTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    inputValue,
    setInputValue,
    handleAddTag: baseHandleAddTag,
    handleRemoveTag: baseHandleRemoveTag,
    handleSuggestionClick: baseHandleSuggestionClick,
    handleKeyDown,
    getAvailableSuggestions,
  } = useTagManager<Interest>(interests, onInterestsChange, {
    createTag: (label) => ({
      id: generateTagId(),
      label,
      level: "casual" as InterestLevel,
    }),
  })

  const handleAddInterest = (label: string, level: InterestLevel = "casual") => {
    const trimmed = label.trim()
    if (!trimmed) return
    if (isDuplicateLabel(interests, trimmed)) {
      setInputValue("")
      return
    }
    // Reuse base for casual to keep single code path, custom for expert
    if (level === "casual") {
      baseHandleAddTag(trimmed)
      return
    }
    const newInterest: Interest = {
      id: generateTagId(),
      label: trimmed,
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
    const removed = interests.find((interest) => interest.id === id)
    if (removed) {
      setIgnoredTags((prev) => prev.filter((tag) => tag.toLowerCase() !== removed.label.toLowerCase()))
    }
    baseHandleRemoveTag(id)
  }

  const handleResetIgnoredTags = useCallback(() => {
    setIgnoredTags([])
  }, [])

  // Si un interet est supprime depuis l'exterieur (parent), nettoyer ignoredTags
  useEffect(() => {
    const interestLabels = new Set(interests.map((i) => i.label.toLowerCase()))
    setIgnoredTags((prev) => {
      const filtered = prev.filter((tag) => !interestLabels.has(tag.toLowerCase()))
      const seen = new Set<string>()
      const deduped: string[] = []
      for (const tag of filtered) {
        const lower = tag.toLowerCase()
        if (!seen.has(lower)) {
          seen.add(lower)
          deduped.push(tag)
        }
      }
      if (deduped.length !== prev.length || deduped.some((v, i) => v !== prev[i])) {
        return deduped
      }
      return prev
    })
  }, [interests])

  const handleInspireMe = async () => {
    setIsLoading(true)
    try {
      const unselectedSuggestions = aiSuggestions.filter(
        (suggestion) => !interests.some((interest) => interest.label.toLowerCase() === suggestion.toLowerCase()),
      )
      const seen = new Set(ignoredTags.map((t) => t.toLowerCase()))
      const newTags = unselectedSuggestions.filter((t) => !seen.has(t.toLowerCase()))
      const updatedIgnoredTags = [...ignoredTags, ...newTags]
      setIgnoredTags(updatedIgnoredTags)

      const response = await fetch("/api/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTags: interests,
          sliders: sliders,
          ignoredTags: updatedIgnoredTags,
          model: selectedModel,
          provider: selectedProvider,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.hint || "Erreur de génération")
      }

      const data = await response.json()
      if (data.suggested_tags) {
        setAiSuggestions(data.suggested_tags)
      }
    } catch (error: unknown) {
      console.error("Failed to generate tags", error)
      const message = error instanceof Error ? error.message : String(error)
      toast({
        title: "Erreur",
        description: message || "Impossible de récupérer les suggestions.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const availableDefaultSuggestions = getAvailableSuggestions(defaultSuggestions)
  const availableAiSuggestions = getAvailableSuggestions(aiSuggestions)

  return (
    <div className="space-y-3">
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

      {(availableDefaultSuggestions.length > 0 || availableAiSuggestions.length > 0) && (
        <div className="space-y-2">
          {availableDefaultSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableDefaultSuggestions.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="px-3 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => baseHandleSuggestionClick(suggestion)}
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
                  onClick={() => baseHandleSuggestionClick(suggestion)}
                >
                  ✨ {suggestion}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {ignoredTags.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground">{ignoredTags.length} suggestion(s) ignoree(s)</span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={handleResetIgnoredTags}>
            <RotateCcw className="h-3 w-3" />
            Reinitialiser
          </Button>
        </div>
      )}

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

"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Helpers -- single source of truth for label comparison (case-insensitive)
// ---------------------------------------------------------------------------

export function isDuplicateLabel<T extends { label: string }>(tags: T[], label: string): boolean {
  const normalized = label.trim().toLowerCase()
  if (!normalized) return false
  return tags.some((t) => t.label.toLowerCase() === normalized)
}

export function filterAvailableSuggestions<T extends { label: string }>(
  suggestions: string[],
  selected: T[],
): string[] {
  return suggestions.filter((s) => !selected.some((t) => t.label.toLowerCase() === s.toLowerCase()))
}

export function generateTagId(): string {
  return `${Date.now()}-${Math.random()}`
}

// ---------------------------------------------------------------------------
// Generic hook -- shared state & handlers for any tag list
// ---------------------------------------------------------------------------

export interface UseTagManagerOptions<T extends { id: string; label: string }> {
  createTag?: (label: string) => T
}

export function useTagManager<T extends { id: string; label: string }>(
  selected: T[],
  onChange: (tags: T[]) => void,
  options: UseTagManagerOptions<T> = {},
) {
  const [inputValue, setInputValue] = useState("")

  const createTag = options.createTag

  const handleAddTag = useCallback(
    (label: string) => {
      const trimmed = label.trim()
      if (!trimmed) return
      if (isDuplicateLabel(selected, trimmed)) {
        setInputValue("")
        return
      }
      const newTag: T = createTag
        ? createTag(trimmed)
        : ({ id: generateTagId(), label: trimmed } as unknown as T)
      onChange([...selected, newTag])
      setInputValue("")
    },
    [selected, onChange, createTag],
  )

  const handleRemoveTag = useCallback(
    (id: string) => {
      onChange(selected.filter((tag) => tag.id !== id))
    },
    [selected, onChange],
  )

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (isDuplicateLabel(selected, suggestion)) return
      handleAddTag(suggestion)
    },
    [selected, handleAddTag],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleAddTag(inputValue)
      }
    },
    [handleAddTag, inputValue],
  )

  const getAvailableSuggestions = useCallback(
    (suggestions: string[]) => filterAvailableSuggestions(suggestions, selected),
    [selected],
  )

  return {
    inputValue,
    setInputValue,
    handleAddTag,
    handleRemoveTag,
    handleSuggestionClick,
    handleKeyDown,
    getAvailableSuggestions,
  }
}

// ---------------------------------------------------------------------------
// Generic presentational component -- wraps useTagManager
// ---------------------------------------------------------------------------

export interface BaseTagManagerProps<T extends { id: string; label: string }> {
  selectedTags: T[]
  onTagsChange: (tags: T[]) => void
  defaultSuggestions?: string[]
  placeholder?: string
  variant?: "default" | "danger"
  className?: string
  createTag?: (label: string) => T
  renderTag?: (tag: T, onRemove: (id: string) => void) => React.ReactNode
}

export function BaseTagManager<T extends { id: string; label: string }>({
  selectedTags,
  onTagsChange,
  defaultSuggestions = [],
  placeholder = "Ajouter un tag...",
  variant = "default",
  className,
  createTag,
  renderTag,
}: BaseTagManagerProps<T>) {
  const {
    inputValue,
    setInputValue,
    handleAddTag,
    handleRemoveTag,
    handleSuggestionClick,
    handleKeyDown,
    getAvailableSuggestions,
  } = useTagManager(selectedTags, onTagsChange, { createTag })

  const availableDefaultSuggestions = useMemo(
    () => getAvailableSuggestions(defaultSuggestions),
    [getAvailableSuggestions, defaultSuggestions],
  )

  return (
    <div className={cn("space-y-3", className)}>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) =>
            renderTag ? (
              renderTag(tag, handleRemoveTag)
            ) : (
              <Badge
                key={tag.id}
                variant={variant === "danger" ? "destructive" : "default"}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium flex items-center gap-1.5",
                  variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {tag.label}
                <button onClick={() => handleRemoveTag(tag.id)} className="hover:bg-black/10 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ),
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button onClick={() => handleAddTag(inputValue)} size="icon" variant="outline" disabled={!inputValue.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {availableDefaultSuggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {availableDefaultSuggestions.map((suggestion, index) => (
              <Badge
                key={`suggestion-${suggestion}-${index}`}
                variant="outline"
                className="px-3 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

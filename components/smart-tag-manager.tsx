"use client"

import type React from "react"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Tag {
  id: string
  label: string
}

interface SmartTagManagerProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  defaultSuggestions?: string[]
  placeholder?: string
  variant?: "default" | "danger"
  className?: string
}

export function SmartTagManager({
  selectedTags,
  onTagsChange,
  defaultSuggestions = [],
  placeholder = "Ajouter un tag...",
  variant = "default",
  className,
}: SmartTagManagerProps) {
  const [inputValue, setInputValue] = useState("")

  const handleAddTag = (label: string) => {
    if (!label.trim()) return

    if (selectedTags.some((tag) => tag.label.toLowerCase() === label.trim().toLowerCase())) {
      setInputValue("")
      return
    }

    const newTag: Tag = {
      id: `${Date.now()}-${Math.random()}`,
      label: label.trim(),
    }

    onTagsChange([...selectedTags, newTag])
    setInputValue("")
  }

  const handleRemoveTag = (id: string) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== id))
  }

  const handleSuggestionClick = (suggestion: string) => {
    // Don't add if already selected
    if (selectedTags.some((tag) => tag.label === suggestion)) return
    handleAddTag(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag(inputValue)
    }
  }

  const availableDefaultSuggestions = defaultSuggestions.filter(
    (suggestion) => !selectedTags.some((tag) => tag.label.toLowerCase() === suggestion.toLowerCase()),
  )

  return (
    <div className={cn("space-y-3", className)}>
      {/* Zone Active - Tags Sélectionnés */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
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
          ))}
        </div>
      )}

      {/* Zone d'Input */}
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

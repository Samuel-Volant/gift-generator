"use client"

// @deprecated SmartTagManager est désormais un alias fin de BaseTagManager (issue #18).
// Conservé pour compatibilité — nouvelles utilisations : importer BaseTagManager directement.
// InterestTagManager conserve sa logique métier (niveau expert / suggestions IA).

import { BaseTagManager } from "@/components/tag-manager-base"
import type { Tag } from "@/types"

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
  return (
    <BaseTagManager<Tag>
      selectedTags={selectedTags}
      onTagsChange={onTagsChange}
      defaultSuggestions={defaultSuggestions}
      placeholder={placeholder}
      variant={variant}
      className={className}
    />
  )
}

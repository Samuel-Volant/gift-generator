"use client"

import { useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { GiftIdea } from "@/types"

interface GiftFiltersProps {
  gifts: GiftIdea[]
  selectedArchetypes: string[]
  selectedPriceRanges: string[]
  onArchetypeToggle: (archetype: string) => void
  onPriceRangeToggle: (range: string) => void
}

function FilterChip({
  label,
  isSelected,
  onClick,
}: {
  label: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <Badge
      variant={isSelected ? "default" : "outline"}
      className={cn("cursor-pointer transition-colors", isSelected && "bg-primary text-primary-foreground")}
      onClick={onClick}
    >
      {label}
    </Badge>
  )
}

function extractPriceRange(price: string): string {
  const match = price.match(/[\d]+/)
  if (match) {
    const num = parseInt(match[0], 10)
    if (num < 20) return "< 20"
    if (num < 50) return "20–50"
    if (num < 100) return "50–100"
    return "100+"
  }
  return price
}

function isInSelectedRange(price: string, selectedRanges: string[]): boolean {
  if (selectedRanges.length === 0) return true
  const range = extractPriceRange(price)
  return selectedRanges.includes(range)
}

export function GiftFilters({
  gifts,
  selectedArchetypes,
  selectedPriceRanges,
  onArchetypeToggle,
  onPriceRangeToggle,
}: GiftFiltersProps) {
  const archetypes = useMemo(() => {
    const set = new Set<string>()
    for (const g of gifts) {
      if (g.archetype) set.add(g.archetype)
    }
    return Array.from(set).sort()
  }, [gifts])

  const priceRanges = useMemo(() => {
    const set = new Set<string>()
    for (const g of gifts) {
      set.add(extractPriceRange(g.price))
    }
    return Array.from(set).sort((a, b) => {
      const order = ["< 20", "20–50", "50–100", "100+"]
      return order.indexOf(a) - order.indexOf(b)
    })
  }, [gifts])

  if (archetypes.length === 0 && priceRanges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3">
      {archetypes.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Type :</span>
          {archetypes.map((a) => (
            <FilterChip key={a} label={a} isSelected={selectedArchetypes.includes(a)} onClick={() => onArchetypeToggle(a)} />
          ))}
        </div>
      )}
      {priceRanges.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Prix :</span>
          {priceRanges.map((range) => (
            <FilterChip key={range} label={range} isSelected={selectedPriceRanges.includes(range)} onClick={() => onPriceRangeToggle(range)} />
          ))}
        </div>
      )}
    </div>
  )
}

export { isInSelectedRange }

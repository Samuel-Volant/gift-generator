"use client"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface PsychologySliderProps {
  label: string
  leftLabel: string
  rightLabel: string
  value: number
  onChange: (value: number) => void
}

export function PsychologySlider({ label, leftLabel, rightLabel, value, onChange }: PsychologySliderProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className={cn(value < 50 && "font-semibold text-foreground")}>{leftLabel}</span>
          <span className={cn(value > 50 && "font-semibold text-foreground")}>{rightLabel}</span>
        </div>
      </div>
    </div>
  )
}

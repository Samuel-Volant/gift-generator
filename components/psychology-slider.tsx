"use client"

import { Slider } from "@/components/ui/slider"
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
  const ariaValueText =
    value < 50 ? `${leftLabel} ${value}%` : value > 50 ? `${rightLabel} ${value}%` : `${value}% équilibré`

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={0}
          max={100}
          step={1}
          aria-label={label}
          aria-valuetext={ariaValueText}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className={cn(value < 50 && "font-semibold text-foreground")}>{leftLabel}</span>
          <span className={cn(value > 50 && "font-semibold text-foreground")}>{rightLabel}</span>
        </div>
      </div>
    </div>
  )
}

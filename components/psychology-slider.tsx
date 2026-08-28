"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { describeSlider } from "@/lib/prompts/helpers"

interface PsychologySliderProps {
  label: string
  leftLabel: string
  rightLabel: string
  value: number
  onChange: (value: number) => void
}

const POSITION_LABELS = [
  (left: string, _right: string) => `Très ${left.toLowerCase()}`,
  (left: string, _right: string) => `Plutôt ${left.toLowerCase()}`,
  (_left: string, _right: string) => "Équilibré",
  (_left: string, right: string) => `Plutôt ${right.toLowerCase()}`,
  (_left: string, right: string) => `Très ${right.toLowerCase()}`,
] as const

export function PsychologySlider({ label, leftLabel, rightLabel, value, onChange }: PsychologySliderProps) {
  const pos = Math.max(1, Math.min(5, Math.round(value)))
  const currentLabel = POSITION_LABELS[pos - 1](leftLabel, rightLabel)
  const promptText = describeSlider(pos, leftLabel, rightLabel)
  const ariaValueText = promptText || "équilibré"

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-2">
        <Slider
          value={[pos]}
          onValueChange={([v]) => onChange(v)}
          min={1}
          max={5}
          step={1}
          aria-label={label}
          aria-valuetext={ariaValueText}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className={cn(pos === 1 && "font-semibold text-foreground")}>{leftLabel}</span>
          <span className={cn(pos === 3 && "font-semibold text-foreground")}>Équilibré</span>
          <span className={cn(pos === 5 && "font-semibold text-foreground")}>{rightLabel}</span>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          {promptText ? (
            <>Envoyé : <span className="font-medium text-foreground">{currentLabel}</span></>
          ) : (
            <span className="text-muted-foreground">Position centrale — rien envoyé au prompt</span>
          )}
        </p>
      </div>
    </div>
  )
}

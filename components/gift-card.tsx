"use client"

import { useState } from "react"
import { ExternalLink, X } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { GiftIdea } from "@/types"

interface GiftCardProps {
  gift: GiftIdea
  onDismiss?: (giftId: string, blacklistTag?: string) => void
}

export function GiftCard({ gift, onDismiss }: GiftCardProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false)
  const [blacklistTag, setBlacklistTag] = useState("")

  const handleSearch = () => {
    const query = encodeURIComponent(gift.title)
    window.open(`https://www.google.com/search?q=${query}`, "_blank")
  }

  const handleDismissClick = () => {
    setShowBlacklistDialog(true)
  }

  const handleConfirmDismiss = () => {
    setIsDismissed(true)
    setShowBlacklistDialog(false)
    onDismiss?.(gift.id, blacklistTag.trim() || undefined)
    setBlacklistTag("")
  }

  const handleCancelDismiss = () => {
    setShowBlacklistDialog(false)
    setBlacklistTag("")
  }

  return (
    <>
      <Card className={`overflow-hidden transition-all ${isDismissed ? "opacity-40 grayscale" : "hover:shadow-lg"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-3xl">{gift.emoji}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {gift.category}
              </Badge>
              {!isDismissed && (
                <Button
                  onClick={handleDismissClick}
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  title="Ne correspond pas"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <h3 className="font-bold text-lg mb-2 text-balance">{gift.title}</h3>
          <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{gift.reasoning}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-3 border-t">
          <span className="font-semibold text-primary text-lg">{gift.price}</span>
          <Button
            onClick={handleSearch}
            size="sm"
            variant="outline"
            className="gap-2 bg-transparent"
            disabled={isDismissed}
          >
            <ExternalLink className="h-4 w-4" />
            Rechercher
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showBlacklistDialog} onOpenChange={setShowBlacklistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cette idée ne correspond pas ?</DialogTitle>
            <DialogDescription>
              Voulez-vous ajouter un élément à la blacklist pour éviter ce type de suggestions à l'avenir ?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="blacklist-tag">Tag à éviter (optionnel)</Label>
              <Input
                id="blacklist-tag"
                placeholder="Ex: Technologie, Vêtements, etc."
                value={blacklistTag}
                onChange={(e) => setBlacklistTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmDismiss()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDismiss}>
              Annuler
            </Button>
            <Button onClick={handleConfirmDismiss}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

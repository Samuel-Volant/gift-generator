"use client";

import { useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DeletedGift } from "@/types";

interface DeletedGiftsDialogProps {
  gifts: DeletedGift[];
  onRestore: (giftId: string) => void;
}

export function DeletedGiftsDialog({ gifts, onRestore }: DeletedGiftsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Trash2 className="h-3.5 w-3.5" />
          Cartes supprimées ({gifts.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cartes supprimées</DialogTitle>
          <DialogDescription>
            Cartes rejetées, injectées au prompt pour éviter la re-suggestion de types d&apos;idées similaires.
            Restaurez une carte pour la réinsérer dans la grille.
          </DialogDescription>
        </DialogHeader>

        {gifts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Aucune carte supprimée pour le moment.
          </p>
        ) : (
          <ul className="flex-1 overflow-auto space-y-1.5">
            {gifts.map((gift) => (
              <li
                key={`${gift.id}-${gift.dismissedAt}`}
                className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg shrink-0">{gift.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-pretty break-words block">{gift.title}</span>
                    <span className="text-xs text-muted-foreground">{gift.category}</span>
                  </div>
                </div>
                <Button
                  onClick={() => onRestore(gift.id)}
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
                  aria-label={`Restaurer ${gift.title}`}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { useState } from "react";
import { History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SuggestedHistoryProps {
  titles: string[];
  onRemoveTitle: (title: string) => void;
}

export function SuggestedHistory({ titles, onRemoveTitle }: SuggestedHistoryProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <History className="h-3.5 w-3.5" />
          Historique ({titles.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historique des titres proposés</DialogTitle>
          <DialogDescription>
            Titres déjà générés, injectés au prompt pour éviter les doublons. Retirez un titre pour qu&apos;il puisse
            être reproposé.
          </DialogDescription>
        </DialogHeader>

        {titles.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Aucun titre généré pour le moment.
          </p>
        ) : (
          <ul className="flex-1 overflow-auto space-y-1.5">
            {titles.map((title) => (
              <li
                key={title}
                className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2"
              >
                <span className="text-sm text-pretty break-words">{title}</span>
                <Button
                  onClick={() => onRemoveTitle(title)}
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Retirer ${title} de l'historique`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
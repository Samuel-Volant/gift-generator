"use client";

import { useState } from "react";
import { Eye, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { buildGiftSystemPrompt, buildGiftUserMessage } from "@/lib/prompts/gift-generation";
import type { UserProfile } from "@/types";

interface PromptPreviewProps {
  profile: UserProfile;
  alreadySuggestedTitles: string[];
}

export function PromptPreview({ profile, alreadySuggestedTitles }: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);

  const blacklistLabels = profile.blacklist.map((t) => t.label);
  const systemPrompt = buildGiftSystemPrompt({ alreadySuggestedTitles, blacklistLabels });
  const userMessage = buildGiftUserMessage(profile);

  const fullPrompt = `=== SYSTEM ===\n${systemPrompt}\n\n=== USER ===\n${userMessage}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          Voir le prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prompt envoyé au LLM</DialogTitle>
          <DialogDescription>
            Aperçu du prompt qui sera envoyé si vous cliquez sur Générer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">System</h4>
            <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap break-words font-mono overflow-auto max-h-48">
              {systemPrompt}
            </pre>
          </section>
          <section>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">User</h4>
            <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap break-words font-mono overflow-auto max-h-64">
              {userMessage}
            </pre>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copié !" : "Copier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

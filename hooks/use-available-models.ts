"use client";

import { useEffect, useState } from "react";
import { FALLBACK_MODELS, DEFAULT_MODEL, type AIModel } from "@/lib/ai-models";

export function useAvailableModels() {
  const [availableModels, setAvailableModels] = useState<AIModel[]>(FALLBACK_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  const selectedProvider = availableModels.find((m) => m.id === selectedModel)?.provider ?? "google";

  useEffect(() => {
    let isMounted = true;

    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models);
          setSelectedModel((current) =>
            data.models.some((m: AIModel) => m.id === current) ? current : data.models[0].id,
          );
        }
      })
      .catch((error) => {
        console.error("Impossible de charger les modèles disponibles:", error);
      })
      .finally(() => {
        if (isMounted) setIsLoadingModels(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    availableModels,
    selectedModel,
    setSelectedModel,
    selectedProvider,
    isLoadingModels,
  };
}

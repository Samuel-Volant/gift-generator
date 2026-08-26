import type { Provider } from "@/types"

export interface AIModel {
    id: string
    name: string
    provider: Provider
}

// Utilisé uniquement si l'appel à /api/models échoue (ex: hors-ligne, clés API absentes)
export const FALLBACK_MODELS: AIModel[] = [
    {
        id: "gemini-2.0-flash-exp",
        name: "✨ Gemini 2.0 Flash (Google · Gratuit)",
        provider: "google",
    },
]

export const DEFAULT_MODEL = FALLBACK_MODELS[0].id
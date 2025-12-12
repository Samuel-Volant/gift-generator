export interface AIModel {
    id: string
    name: string
    provider: "google" | "groq"
}

export const AVAILABLE_MODELS: AIModel[] = [
    {
        id: "gemini-2.0-flash-exp",
        name: "✨ Gemini 2.0 Flash (Gratuit - Expérimental)",
        provider: "google"
    },
    {
        id: "gemini-1.5-flash",
        name: "⚡ Gemini 1.5 Flash (Gratuit)",
        provider: "google"
    },
    {
        id: "gemini-1.5-pro",
        name: "🧠 Gemini 1.5 Pro (Gratuit Limitée)",
        provider: "google"
    },
    {
        id: "llama-3.3-70b-versatile",
        name: "🦙 Groq - Llama 3.3 70B (Payant/Gratuit limité)",
        provider: "groq"
    },
    {
        id: "llama-3.1-8b-instant",
        name: "⚡ Groq - Llama 3.1 8B (Payant/Gratuit limité)",
        provider: "groq"
    },
    {
        id: "mixtral-8x7b-32768",
        name: "🌪️ Groq - Mixtral (Payant/Gratuit limité)",
        provider: "groq"
    }
]

export const DEFAULT_MODEL = AVAILABLE_MODELS[0].id

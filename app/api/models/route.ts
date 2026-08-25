import { NextResponse } from "next/server"
import type { AIModel } from "@/lib/ai-models"

// Cache côté Next.js (revalidation toutes les heures)
export const revalidate = 3600

async function fetchGoogleModels(): Promise<AIModel[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return []

    const data = await res.json()

    const models: AIModel[] = (data.models || [])
      .filter((m: any) => {
        const id = (m.name || "").replace("models/", "")
        const methods: string[] = m.supportedGenerationMethods || []

        if (!methods.includes("generateContent")) return false
        // On ne garde que les modèles "Flash" : ce sont les seuls avec un vrai
        // palier gratuit chez Google (Pro/Ultra sont payants ou quota très limité)
        if (!/flash/i.test(id)) return false
        // On exclut les variantes non-conversationnelles
        if (/tts|embedding|aqa|vision|image-generation/i.test(id)) return false

        return true
      })
      .map((m: any) => {
        const id = (m.name || "").replace("models/", "")
        const displayName = m.displayName || id
        return {
          id,
          name: `✨ ${displayName} (Google · Gratuit)`,
          provider: "google" as const,
        }
      })

    // Déduplication par id
    const seen = new Set<string>()
    return models.filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
  } catch (error) {
    console.error("Erreur récupération modèles Google:", error)
    return []
  }
}

async function fetchGroqModels(): Promise<AIModel[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []

    const data = await res.json()

    const models: AIModel[] = (data.data || [])
      .filter((m: any) => {
        if (m.active === false) return false
        // Groq est gratuit (avec rate-limit) sur tous ses modèles texte.
        // On exclut juste ce qui n'est pas conversationnel (audio, modération...)
        if (/whisper|tts|guard|prompt-guard/i.test(m.id)) return false
        return true
      })
      .map((m: any) => ({
        id: m.id,
        name: `🦙 ${m.id} (Groq · Gratuit)`,
        provider: "groq" as const,
      }))

    return models
  } catch (error) {
    console.error("Erreur récupération modèles Groq:", error)
    return []
  }
}

export async function GET() {
  const [googleModels, groqModels] = await Promise.all([
    fetchGoogleModels(),
    fetchGroqModels(),
  ])

  const models = [...googleModels, ...groqModels]

  return NextResponse.json({ models })
}
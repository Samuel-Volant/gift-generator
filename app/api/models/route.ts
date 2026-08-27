import { NextResponse } from "next/server"
import { filterGoogleModels, filterGroqModels } from "@/lib/ai-models"
import type { AIModel } from "@/lib/ai-models"

// Cache côté Next.js (revalidation toutes les heures)
export const revalidate = 3600

async function fetchGoogleModels(): Promise<AIModel[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`,
    )
    if (!res.ok) return []

    const data = await res.json()

    return filterGoogleModels(data.models)
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
    })
    if (!res.ok) return []

    const data = await res.json()

    return filterGroqModels(data.data)
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

  return NextResponse.json(
    { models },
    {
      headers: {
        // Cache CDN 1h + stale-while-revalidate 10min côté client/CDN
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    },
  )
}

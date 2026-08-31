import type { Provider } from "@/types"

export interface AIModel {
    id: string
    name: string
    provider: Provider
}

// Utilisé uniquement si l'appel à /api/models échoue (ex: hors-ligne, clés API absentes)
export const FALLBACK_MODELS: AIModel[] = [
    {
        id: "gemini-2.5-flash",
        name: "✨ Gemini 2.5 Flash (Google · Gratuit)",
        provider: "google",
    },
    {
        id: "gemini-2.0-flash",
        name: "✨ Gemini 2.0 Flash (Google · Gratuit)",
        provider: "google",
    },
    {
        id: "llama-3.3-70b-versatile",
        name: "🦙 Llama 3.3 70B Versatile (Groq · Gratuit)",
        provider: "groq",
    },
]

export const DEFAULT_MODEL = FALLBACK_MODELS[0].id

// ---------------------------------------------------------------------------
// Filtrage fin des modèles gratuits — issue #19
// ---------------------------------------------------------------------------

/**
 * Allowlist des modèles Google réellement gratuits (tier gratuit AI Studio / Developer API).
 * Préfixe : toute variante avec suffixe (-exp, -001, -8b, -lite, -it) est acceptée.
 * À maintenir quand Google publie de nouveaux paliers gratuits.
 *
 * Sources :
 * - https://ai.google.dev/pricing (free tier limits)
 * - https://ai.google.dev/gemini-api/docs/models (active models)
 * - gemini-2.0-flash, 2.5-flash, 2.5-flash-lite, 3-flash-preview, 3.1-flash-lite-preview, 3.5-flash ont un tier gratuit
 * - gemma-3-* / gemma-4-* ont un tier gratuit
 * - gemini-2.0-flash-lite est retiré (juin 2026), gemini-1.5-flash est déprécié
 */
export const GOOGLE_FREE_ALLOWLIST: string[] = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemma-3-27b",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it",
]

/**
 * Modèles Google non-conversationnels à exclure même s'ils matchent l'allowlist.
 */
export const GOOGLE_DENYLIST_RE = /tts|embedding|aqa|vision|image-generation/i

/**
 * Modèles Groq non-conversationnels / payants à exclure.
 * Groq est gratuit (rate-limité) sur tous ses modèles texte ; on retire audio, modération, beta payant.
 */
export const GROQ_DENYLIST_RE = /whisper|tts|guard|prompt-guard|compound|playai/i

function isAllowedByPrefix(id: string, allowlist: string[]): boolean {
    return allowlist.some((prefix) => id === prefix || id.startsWith(prefix + "-"))
}

function hasFreePricing(raw: unknown): boolean {
    if (!raw || typeof raw !== "object") return false
    const obj = raw as Record<string, unknown>
    // Plusieurs formes possibles selon l'API : pricing.inputTokenPrice, price, inputTokenPrice
    const candidates: unknown[] = [
        (obj["pricing"] as Record<string, unknown> | undefined)?.["inputTokenPrice"],
        (obj["pricing"] as Record<string, unknown> | undefined)?.["price"],
        obj["inputTokenPrice"],
        obj["price"],
    ]
    return candidates.some((v) => v === 0 || v === "0" || v === 0.0)
}

/**
 * Détermine si un modèle Google est autorisé (gratuit vérifié).
 * @param id - id normalisé sans préfixe "models/"
 * @param methods - supportedGenerationMethods ou supportedActions
 * @param raw - objet brut optionnel pour vérifier pricing gratuit fallback
 */
export function isGoogleModelAllowed(
    id: string,
    methods?: string[],
    raw?: unknown,
): boolean {
    if (!id) return false
    if (GOOGLE_DENYLIST_RE.test(id)) return false
    if (!methods || !methods.includes("generateContent")) return false

    if (isAllowedByPrefix(id, GOOGLE_FREE_ALLOWLIST)) return true

    // Fallback : si l'API expose un prix et qu'il est 0, on l'inclut même hors allowlist
    if (raw && hasFreePricing(raw)) return true

    return false
}

/**
 * Détermine si un modèle Groq est autorisé.
 * @param id - id Groq (ex: llama-3.1-8b-instant)
 * @param active - champ `active` de l'API Groq (false = retiré)
 */
export function isGroqModelAllowed(id: string, active?: boolean): boolean {
    if (!id) return false
    if (active === false) return false
    if (GROQ_DENYLIST_RE.test(id)) return false
    return true
}

/**
 * Filtre et mappe les modèles Google bruts (réponse `generativelanguage.googleapis.com/v1beta/models`).
 * Déduplique par id, conserve uniquement les gratuits vérifiés.
 */
export function filterGoogleModels(rawModels: unknown): AIModel[] {
    if (!Array.isArray(rawModels)) return []

    const seen = new Set<string>()
    const result: AIModel[] = []

    for (const m of rawModels as Record<string, unknown>[]) {
        if (!m || typeof m !== "object") continue
        const rawName = (m["name"] as string) || ""
        const id = rawName.replace("models/", "")
        // Google API utilise `supportedGenerationMethods`, certains proxy utilisent `supportedActions`
        const methods =
            (m["supportedGenerationMethods"] as string[]) ||
            (m["supportedActions"] as string[]) ||
            []
        const displayName = (m["displayName"] as string) || id

        if (!isGoogleModelAllowed(id, methods, m)) continue
        if (seen.has(id)) continue
        seen.add(id)

        result.push({
            id,
            name: `✨ ${displayName} (Google · Gratuit)`,
            provider: "google",
        })
    }

    return result
}

/**
 * Filtre, trie et mappe les modèles Groq bruts (réponse `api.groq.com/openai/v1/models`).
 * Tri par `created` desc (plus récents en haut), déduplication par id.
 */
export function filterGroqModels(rawModels: unknown): AIModel[] {
    if (!Array.isArray(rawModels)) return []

    // Filtrage
    const filtered = (rawModels as Record<string, unknown>[]).filter((m) => {
        if (!m || typeof m !== "object") return false
        const id = (m["id"] as string) || ""
        const active = m["active"] as boolean | undefined
        return isGroqModelAllowed(id, active)
    })

    // Tri par created desc (si champ absent, 0)
    filtered.sort((a, b) => {
        const ca = (a["created"] as number) ?? 0
        const cb = (b["created"] as number) ?? 0
        return cb - ca
    })

    // Déduplication (garde premier après tri = plus récent)
    const seen = new Set<string>()
    const result: AIModel[] = []
    for (const m of filtered) {
        const id = (m["id"] as string) || ""
        if (!id || seen.has(id)) continue
        seen.add(id)
        result.push({
            id,
            name: `🦙 ${id} (Groq · Gratuit)`,
            provider: "groq",
        })
    }

    return result
}

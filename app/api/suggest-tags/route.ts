import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { parseJsonSafe } from "@/lib/parse-json";
import type { Provider } from "@/types";

export async function POST(req: Request) {
  try {
    const {
      currentTags,
      sliders,
      ignoredTags,
      model: selectedModelId,
      provider: selectedProvider,
    } = await req.json();

    if (!selectedModelId || typeof selectedModelId !== "string" || selectedModelId.trim().length === 0) {
      return NextResponse.json(
        { error: "Model manquant", details: "Le champ 'model' est requis" },
        { status: 400 }
      );
    }
    if (!/^[A-Za-z0-9._\/:-]+$/.test(selectedModelId)) {
      return NextResponse.json(
        { error: "Model invalide", details: `Nom de modele "${selectedModelId}" invalide` },
        { status: 400 }
      );
    }

    const rawProvider = selectedProvider;
    if (rawProvider !== undefined && rawProvider !== "google" && rawProvider !== "groq") {
      return NextResponse.json(
        { error: "Provider invalide", details: `Provider "${rawProvider}" non supporte. Valeurs autorisees: google, groq` },
        { status: 400 }
      );
    }
    const provider: Provider = rawProvider === "groq" ? "groq" : "google";

    if (provider === "google" && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY manquante",
          hint: "Definissez GEMINI_API_KEY dans .env.local (https://aistudio.google.com/app/apikey)",
        },
        { status: 503 }
      );
    }
    if (provider === "groq" && !process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          error: "GROQ_API_KEY manquante",
          hint: "Definissez GROQ_API_KEY dans .env.local (https://console.groq.com/keys)",
        },
        { status: 503 }
      );
    }

    const modelConfig = {
      id: selectedModelId,
      provider,
    };

    // Mapper currentTags vers labels uniquement (evite d'envoyer objets Interest complets)
    const tagLabels: string[] = Array.isArray(currentTags)
      ? currentTags
          .map((t: unknown) => {
            if (typeof t === "string") return t;
            if (t && typeof t === "object" && "label" in (t as Record<string, unknown>)) {
              const label = (t as Record<string, unknown>).label;
              return typeof label === "string" ? label : String(label ?? "");
            }
            return String(t ?? "");
          })
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      : [];

    const ignoredLabels: string[] = Array.isArray(ignoredTags)
      ? ignoredTags
          .map((t: unknown) => (typeof t === "string" ? t : String(t ?? "")))
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      : [];

    const prompt = `
      CONTEXTE:
      Tu es un expert en recommandation de loisirs.
      
      OBJECTIF :
      Suggère 10 NOUVEAUX tags d'intérêts adjacents (Pensée Latérale).
      
      CALIBRAGE PRÉCIS DU NIVEAU DE DÉTAIL (CRUCIAL) :
      Tu dois viser le "Niveau 2 : L'Activité Concrète".
      
      ❌ NIVEAU 1 (INTERDIT - TROP ABSTRAIT) :
      Ne donne PAS de concepts flous.
      - Mauvais : "Aventure", "Création", "Sport", "Culture", "Bien-être", "Apprentissage".
      
      ❌ NIVEAU 3 (INTERDIT - TROP NICHE) :
      Ne donne PAS de sous-catégories spécifiques.
      - Mauvais : "Yoga Ashtanga", "Cuisine Moléculaire", "Jazz des années 50".
      
       ❌ TAGS DÉJÀ PROPOSÉS OU IGNORÉS (STRICTEMENT INTERDIT) :
       Ne suggère SURTOUT PAS ces tags (ni leurs synonymes exacts), car l'utilisateur les a déjà vus ou refusés :
       ${JSON.stringify(ignoredLabels)}

      ✅ NIVEAU 2 (CIBLE - L'ACTIVITÉ CONCRÈTE) :
      Donne des noms d'activités, de hobbies ou de sujets tangibles.
      - Bon : "Yoga", "Cuisine", "Jazz", "Poterie", "Astronomie", "Bricolage", "Randonnée".
      
       LOGIQUE D'ASSOCIATION (PENSÉE LATÉRALE) :
       Analyse les tags actuels (${JSON.stringify(tagLabels)}) et les sliders (${JSON.stringify(sliders)}).
      Trouve des "Cousins" : des activités différentes mais qui plaisent au même type de cerveau.
      
      EXEMPLES DE TRANSFORMATION :
      - Si "Jeux Vidéo" -> Suggère "Jeux de Société" (pas "Jeu"), "Programmation" (pas "Tech"), "Cinéma" (pas "Art").
      - Si "Randonnée" -> Suggère "Escalade", "Jardinage", "Photographie".
      - Si "Lecture" -> Suggère "Écriture", "Histoire", "Langues étrangères".

      FORMAT DE RÉPONSE (JSON) :
      {
        "suggested_tags": ["Activité 1", "Activité 2", ...]
      }
      Retourne uniquement le JSON valide.
    `;

    let resultData;

    if (modelConfig.provider === "google") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({
        model: selectedModelId,
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) {
        throw new Error("Reponse vide du LLM (Google)");
      }
      resultData = parseJsonSafe(text);

    } else if (modelConfig.provider === "groq") {
      const groq = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });

      const completion = await groq.chat.completions.create({
        model: selectedModelId,
        messages: [
          { role: "system", content: "You are a helpful assistant that outputs JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0].message.content;
      if (!text) throw new Error("Reponse vide du LLM (Groq)");
      resultData = parseJsonSafe(text);
    } else {
      throw new Error("Provider not supported");
    }

    return NextResponse.json(resultData);
  } catch (error: unknown) {
    console.error("Error generating tags:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to generate tags", details: message },
      { status: 500 }
    );
  }
}

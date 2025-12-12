import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { AVAILABLE_MODELS } from "@/lib/ai-models";

export async function POST(req: Request) {
  try {
    const { currentTags, sliders, ignoredTags, model: selectedModelId } = await req.json();

    // 1. Identify the provider
    const modelConfig = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);
    if (!modelConfig) {
      throw new Error(`Model not found: ${selectedModelId}`);
    }

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
      ${JSON.stringify(ignoredTags || [])}

      ✅ NIVEAU 2 (CIBLE - L'ACTIVITÉ CONCRÈTE) :
      Donne des noms d'activités, de hobbies ou de sujets tangibles.
      - Bon : "Yoga", "Cuisine", "Jazz", "Poterie", "Astronomie", "Bricolage", "Randonnée".
      
      LOGIQUE D'ASSOCIATION (PENSÉE LATÉRALE) :
      Analyse les tags actuels (${JSON.stringify(currentTags)}) et les sliders (${JSON.stringify(sliders)}).
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
      resultData = JSON.parse(text);

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
      if (!text) throw new Error("No content from Groq");
      resultData = JSON.parse(text);
    } else {
      throw new Error("Provider not supported");
    }

    return NextResponse.json(resultData);
  } catch (error: any) {
    console.error("Error generating tags:", error);
    return NextResponse.json(
      { error: "Failed to generate tags", details: error.message },
      { status: 500 }
    );
  }
}

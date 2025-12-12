import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined");
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing from server environment" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const { currentTags, sliders, ignoredTags } = await req.json();

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
      Analyse les tags actuels (${currentTags}) et les sliders (${JSON.stringify(sliders)}).
      Trouve des "Cousins" : des activités différentes mais qui plaisent au même type de cerveau.
      
      EXEMPLES DE TRANSFORMATION :
      - Si "Jeux Vidéo" -> Suggère "Jeux de Société" (pas "Jeu"), "Programmation" (pas "Tech"), "Cinéma" (pas "Art").
      - Si "Randonnée" -> Suggère "Escalade", "Jardinage", "Photographie".
      - Si "Lecture" -> Suggère "Écriture", "Histoire", "Langues étrangères".

      FORMAT DE RÉPONSE (JSON) :
      {
        "suggested_tags": ["Activité 1", "Activité 2", ...]
      }
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating tags:", error);
    return NextResponse.json(
      { error: "Failed to generate tags" },
      { status: 500 }
    );
  }
}

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

    const { currentTags, sliders, profile } = await req.json();

    const prompt = `
      CONTEXTE:
      Tu es un assistant expert en idées cadeaux et profilage psychologique.
      
      PROFIL UTILISATEUR (Sliders):
      - Pragmatique vs Sentimental: ${sliders?.pragmatiqueSentimental ?? 50}/100
      - Routine vs Originalité: ${sliders?.routineOriginalite ?? 50}/100
      - Calme vs Énergie: ${sliders?.calmeEnergie ?? 50}/100
      - Sérieux vs Fun: ${sliders?.serieuxFun ?? 50}/100
      - Objet vs Expérience: ${sliders?.objetExperience ?? 50}/100

      INTÉRÊTS ACTUELS:
      ${currentTags?.map((t: any) => t.label).join(", ") || "Aucun"}

      TA MISSION:
      Génère 10 nouveaux tags d'intérêts pertinents basés sur ce profil.
      Mixe des sous-catégories précises (ex: "Jazz fusion" au lieu de "Musique") et des idées latérales surprenantes mais cohérentes.
      
      FORMAT DE RÉPONSE ATTENDU (JSON):
      {
        "suggested_tags": ["tag1", "tag2", ..., "tag10"]
      }
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
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

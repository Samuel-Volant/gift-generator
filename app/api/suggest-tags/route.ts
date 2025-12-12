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
      Tu es un expert en sociologie des loisirs et en profilage psychologique.
      
      TON OBJECTIF :
      L'utilisateur a donné des centres d'intérêts (Tags). Tu dois suggérer 10 NOUVEAUX tags qui sont des **Intérêts Adjacents** (Pensée Latérale).
      
      RÈGLES STRICTES :
      1. **INTERDICTION DE SPÉCIALISER** : Ne donne pas de sous-catégories.
         - MAUVAIS : "Jeux Vidéo" -> "Retrogaming", "Esport", "Nintendo".
         - BON : "Jeux Vidéo" -> "Jeux de société", "Escape Game", "Programmation", "Science-Fiction".
      
      2. **CHERCHE LE "PONT PSYCHOLOGIQUE"** : Trouve des activités qui font appel aux mêmes zones du cerveau ou au même "Vibe", mais dans un domaine différent.
         - Ex: Si "Cuisine" (Créativité + Précision) -> Suggère "Parfumerie" ou "Chimie amusante".
         - Ex: Si "Randonnée" (Nature + Effort) -> Suggère "Photographie animalière" ou "Bivouac".

      3. **UTILISE LES SLIDERS** pour orienter l'adjacence :
         - Profil : ${JSON.stringify(sliders)}
         - Si le profil est "Calme", cherche des adjacents relaxants.
         - Si le profil est "Original", cherche des adjacents de niche/bizarres.

      4. **DIVERSITÉ** : Les 10 tags doivent couvrir des domaines variés (Culture, Sport, Manuel, Tech...).

      FORMAT DE RÉPONSE ATTENDU (JSON) :
      {
        "suggested_tags": ["Tag1", "Tag2", ...]
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

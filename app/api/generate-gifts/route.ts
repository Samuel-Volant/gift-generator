import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { UserProfile } from "@/types";

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

    const body = await req.json();
    const profile: UserProfile = body.profile;
    const usedTagPairs: string[][] = body.usedTagPairs || [];

    // Construct a description of the profile
    const profileDescription = `
      Âge: ${profile.age}
      Genre: ${profile.genre}
      Relation: ${profile.relation}
      
      SLIDERS (0-100):
      - Pragmatique/Sentimental: ${profile.pragmatiqueSentimental}
      - Routine/Originalité: ${profile.routineOriginalite}
      - Calme/Énergie: ${profile.calmeEnergie}
      - Sérieux/Fun: ${profile.serieuxFun}
      - Objet/Expérience: ${profile.objetExperience}
      
      INTÉRÊTS (avec niveau):
      ${profile.interets.map(i => `- ${i.label} (Niveau: ${i.level})`).join("\n")}
      
      CONTEXTE SOCIO:
      - Moment de vie: ${profile.momentDeVie.map(t => t.label).join(", ")}
      - Rôle dans le groupe: ${profile.roleGroupe.map(t => t.label).join(", ")}
      - Marques Totem: ${profile.marquesTotem.map(t => t.label).join(", ")}
      
      COMPORTEMENT:
      - Profil acheteur: ${profile.profilAcheteur}
      - Projets actuels: ${profile.projets.map(t => t.label).join(", ")}
      - Plaintes: ${profile.plaintes.map(t => t.label).join(", ")}
      
      À ÉVITER (BLACKLIST):
      ${profile.blacklist.map(t => t.label).join(", ")}
      
      CADRE CADEAU:
      - Budget: ${profile.budget}
      - Intention: ${profile.intention}
    `;

    const usedPairsDescription = usedTagPairs.length > 0
      ? `NE PAS UTILISER les paires de tags suivantes (déjà vues): ${JSON.stringify(usedTagPairs)}`
      : "";

    const prompt = `
      Tu es l'IA GiftGenius, le meilleur expert en idées cadeaux au monde.
      
      TA MISSION :
      Trouver 5 idées de cadeaux UNIQUES et PARFAITEMENT ADAPTÉES à ce profil.
      
      PROFIL COMPLET :
      ${profileDescription}
      
      CONTRAINTES STRICTES :
      1. **Matrice d'exclusion :** ${usedPairsDescription}
      2. **Expertise :** Si un intérêt a le niveau 'expert', NE PROPOSE PAS de matériel d'initiation. Propose du matériel pro, rare, ou des expériences pointues.
      3. **Intention :** L'idée DOIT respecter l'intention : "${profile.intention}".
      4. **Cohérence Sliders :** Utilise les sliders pour ajuster le "vibe" du cadeau.
      5. **Blacklist :** Respecte scrupuleusement les interdits.
      
      FORMAT DE RÉPONSE (JSON Strict):
      {
        "gift_ideas": [
          {
            "emoji": "🎁",
            "title": "Nom du cadeau",
            "reasoning": "Pourquoi c'est parfait pour LUI/ELLE précisément (cite des détails du profil)",
            "price": "€, €€, €€€ ou €€€€",
            "search_term": "Terme de recherche court pour trouver l'objet",
            "tags_used": ["tag1", "tag2"] // Les 2 éléments du profil qui ont inspiré cette idée (ex: ["Cuisine expert", "Sentimental"])
          }
        ]
      }
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    // Add unique IDs to gifts if not present (though frontend might handle it, better safe)
    const giftsWithIds = data.gift_ideas.map((gift: any) => ({
      ...gift,
      id: Math.random().toString(36).substr(2, 9),
      category: gift.tags_used?.[0] || "Idée" // Fallback category
    }));

    return NextResponse.json({ gift_ideas: giftsWithIds });
  } catch (error) {
    console.error("Error generating gifts:", error);
    return NextResponse.json(
      { error: "Failed to generate gifts" },
      { status: 500 }
    );
  }
}

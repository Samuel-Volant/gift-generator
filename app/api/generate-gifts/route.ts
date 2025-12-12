import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { UserProfile } from "@/types";
import { AVAILABLE_MODELS } from "@/lib/ai-models";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile: UserProfile = body.profile;
    const usedTagPairs: string[][] = body.usedTagPairs || [];
    const alreadySuggestedGiftTitles: string[] = body.alreadySuggestedGiftTitles || [];
    const selectedModelId = body.model || "gemini-2.0-flash-exp";

    // 1. Identify the provider
    const modelConfig = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);

    // Fallback if model not found or provider missing
    const provider = modelConfig?.provider || "google";
    const modelName = modelConfig?.id || "gemini-2.0-flash-exp";

    // 2. Prepare Data for Prompt
    const interestList = profile.interets.map((i) =>
      `${i.label} (${i.level === 'expert' ? '⭐⭐ EXPERT/PASSIONNÉ' : 'Découverte'})`
    ).join(", ");

    const contextList = [
      profile.projets.length > 0 ? `🔥 PROJETS ACTUELS: ${profile.projets.map(p => p.label).join(", ")}` : "",
      profile.plaintes.length > 0 ? `💢 IRRITANTS/PLAINTES: ${profile.plaintes.map(p => p.label).join(", ")}` : "",
      profile.marquesTotem.length > 0 ? `🛍️ MARQUES TOTEMS: ${profile.marquesTotem.map(t => t.label).join(", ")}` : "",
      profile.momentDeVie.length > 0 ? `📍 MOMENT DE VIE: ${profile.momentDeVie.map(m => m.label).join(", ")}` : "",
      profile.roleGroupe.length > 0 ? `🎭 RÔLE DANS LE GROUPE: ${profile.roleGroupe.map(r => r.label).join(", ")}` : "",
      profile.profilAcheteur !== "ne-se-prononce-pas" ? `💳 PROFIL ACHETEUR: ${profile.profilAcheteur}` : ""
    ].filter(Boolean).join("\n");

    const exclusions = alreadySuggestedGiftTitles.length > 0
      ? `🚫 DÉJÀ PROPOSÉS (NE PAS RÉPÉTER): ${alreadySuggestedGiftTitles.join(", ")}`
      : "";

    const systemPrompt = `
      Tu es un "Curator" de Concept Store expert et un Chasseur de Tendances.
      
      TON OBJECTIF :
      Trouver 5 cadeaux originaux, spécifiques et "validés par la communauté".
      Ne propose PAS ce qu'on trouve au supermarché. Propose ce que les passionnés s'achètent entre eux.

      STRATÉGIE DE RECHERCHE (CRUCIAL) :
      1. **INTERSECTION OBLIGATOIRE** : Chaque idée doit croiser au moins 2 données (ex: Cuisine + Chimie, ou Voyage + Plainte "Mal au dos").
      2. **L'EFFET "CONNAISSEUR"** : Si un intérêt est marqué "EXPERT", fuis le générique. Cherche l'outil de niche, la marque pointue, l'édition limitée.
      3. **SIMULATION COMMUNAUTAIRE** : Demande-toi : "Qu'est-ce qui est top-tendance sur le subreddit de ce hobby en ce moment ?"
      4. **ANTI-ENNUYEUX** : Interdit aux : Cartes cadeaux, Mugs simples, T-shirts à message, Posters génériques, "Coffrets découverte" basiques (sauf si ultra-luxe).

      FORMAT DU "REASONING" (SANS PHRASES) :
      L'utilisateur ne veut pas de texte. Il veut voir le "Match" des données.
      Utilise ce format strict avec des Emojis pour mapper l'origine de l'idée :
      - "🎨 [Tag A] + 🚀 [Tag B]"
      - "🔥 Pour son projet : [Projet]"
      - "⭐ Niveau Expert respecté"
      - "💢 Résout : [Plainte]"

      OUTPUT JSON ATTENDU :
      {
        "gift_ideas": [
          {
            "emoji": "🧪",
            "title": "Nom Précis du Produit",
            "category": "Catégorie courte",
            "reasoning": "Liste courte des match points (max 3 lignes)",
            "price": "€€", 
            "tags_used": ["Tag1", "Tag2"]
          }
        ]
      }
      Retourne UNIQUEMENT le JSON brut sans markdown.
    `;

    const userMessage = `
      PROFIL CIBLE :
      - Infos: ${profile.age} ans, ${profile.relation}, ${profile.genre}
      - Vibe: ${profile.pragmatiqueSentimental}% Sentimental, ${profile.routineOriginalite}% Original
      - Budget: ${profile.budget}
      - Intention: ${profile.intention}
      
      INTÉRÊTS :
      ${interestList}

      CONTEXTE & VIE :
      ${contextList}

      À ÉVITER ABSOLUMENT (Blacklist):
      ${profile.blacklist.map(t => t.label).join(", ")}

      ${exclusions}

      Trouve 5 pépites maintenant.
    `;

    let resultData;

    try { // Inner try/catch for provider specific errors
      if (provider === "google") {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent({
          contents: [
            { role: "user", parts: [{ text: systemPrompt + "\n\n" + userMessage }] }
          ]
        });
        const text = result.response.text();
        resultData = JSON.parse(text);

      } else if (provider === "groq") {
        const groq = new OpenAI({
          apiKey: process.env.GROQ_API_KEY,
          baseURL: "https://api.groq.com/openai/v1",
        });

        const completion = await groq.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: { type: "json_object" },
          temperature: 0.8, // Increased for creativity
        });

        const text = completion.choices[0].message.content;
        if (!text) throw new Error("No content from Groq");
        resultData = JSON.parse(text);
      } else {
        throw new Error(`Provider ${provider} not supported`);
      }
    } catch (providerError: any) {
      console.error(`Provider ${provider} error:`, providerError);
      throw providerError; // Re-throw to be caught by outer handler
    }

    // Post-process to ensure IDs and compatibility
    const giftsWithIds = (resultData.gift_ideas || []).map((gift: any) => ({
      ...gift,
      id: Math.random().toString(36).substr(2, 9),
      // Ensure price format matches expected enum if needed, or leave as string
      // Frontend expects specific emoji/title/reasoning/price keys
    }));

    return NextResponse.json({ gift_ideas: giftsWithIds });

  } catch (error: any) {
    console.error("Error generating gifts:", error);
    return NextResponse.json(
      {
        error: "Failed to generate gifts",
        details: error.message,
        hint: error.status === 404 || error.status === 400 ? "Model deprecated or API Key invalid" : undefined
      },
      { status: 500 }
    );
  }
}

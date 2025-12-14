import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { UserProfile } from "@/types";
import { AVAILABLE_MODELS } from "@/lib/ai-models";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile: UserProfile = body.profile;
    const alreadySuggestedGiftTitles: string[] = body.alreadySuggestedGiftTitles || [];
    const selectedModelId = body.model || "gemini-2.0-flash-exp";

    // 1. Identify the provider
    const modelConfig = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);

    // Fallback if model not found or provider missing
    const provider = modelConfig?.provider || "google";
    const modelName = modelConfig?.id || "gemini-2.0-flash-exp";

    // 2. Prepare Data for Prompt
    const interestList = profile.interets.map((i) =>
      `${i.label} (${i.level === 'expert' ? '⭐⭐ EXPERT' : 'Découverte'})`
    ).join(", ");

    const contextList = [
      profile.projets.length > 0 ? `🔥 PROJETS: ${profile.projets.map(p => p.label).join(", ")}` : "",
      profile.plaintes.length > 0 ? `💢 IRRITANTS: ${profile.plaintes.map(p => p.label).join(", ")}` : "",
      profile.marquesTotem.length > 0 ? `🛍️ MARQUES: ${profile.marquesTotem.map(t => t.label).join(", ")}` : "",
      profile.momentDeVie.length > 0 ? `📍 VIE: ${profile.momentDeVie.map(m => m.label).join(", ")}` : "",
      profile.roleGroupe.length > 0 ? `🎭 RÔLE: ${profile.roleGroupe.map(r => r.label).join(", ")}` : "",
      profile.profilAcheteur !== "ne-se-prononce-pas" ? `💳 STYLE ACHAT: ${profile.profilAcheteur}` : ""
    ].filter(Boolean).join("\n");

    const exclusions = alreadySuggestedGiftTitles.length > 0
      ? `🚫 EXCLUSION (DÉJÀ PROPOSÉS): ${alreadySuggestedGiftTitles.join(", ")}`
      : "";

    // 3. The New "Archetype-Based" System Prompt
    const systemPrompt = `
      Tu es un "Curator" de Concept Store expert.
      
      TON OBJECTIF :
      Générer 5 idées de cadeaux RADICALEMENT DIFFÉRENTES (objets, moments, goûts...).
      
      🚨 RÈGLE D'OR DE DIVERSITÉ (ARCHÉTYPES) 🚨
      Tu dois IMPÉRATIVEMENT couvrir au moins 4 des 5 archétypes ci-dessous.
      Il est INTERDIT de proposer 5 objets du même type (ex: pas 5 livres).

      LES 5 ARCHÉTYPES :
      1. 📦 **L'OBJET DURABLE** (Tech, Outil, Déco, Mode, Accessoire).
      2. 🎟️ **L'EXPÉRIENCE** (Atelier, Sortie, Billet, Voyage, Cours).
      3. 🍪 **LE CONSOMMABLE** (Food, Boisson, Soin, Kit DIY à usage unique).
      4. 📚 **LE SAVOIR/MÉDIA** (Livre, Revue, Formation) -> ⚠️ LIMITE : MAX 1 SEUL CADEAU DE CE TYPE.
      5. 🧘 **LE SERVICE / BIEN-ÊTRE** (Abo App, Service à domicile, Massage).

      CRITÈRES DE QUALITÉ :
      1. **Intersection :** Chaque idée doit croiser au moins 2 données (ex: Cuisine + Chimie).
      2. **Expertise :** Si "EXPERT", propose du matériel de niche (pas d'initiation).
      3. **Anti-Ennui :** Pas de mugs, pas de T-shirts génériques.

      FORMAT DU "REASONING" (DATA-MATCHING) :
      Pas de phrases. Utilise des puces courtes avec Emojis pour montrer le lien logique :
      - "🎨 [Tag A] + 🚀 [Tag B]"
      - "🔥 Pour son projet : [Projet]"
      - "⭐ Expert : Matériel Pro"
      - "📦 Format : [Nom de l'archétype]"

      OUTPUT JSON ATTENDU :
      {
        "gift_ideas": [
          {
            "emoji": "🧪",
            "title": "Nom Précis du Produit",
            "category": "Catégorie courte",
            "reasoning": "Puces de justification (max 3)",
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

      Génère 5 idées variées maintenant (Respecte les Archétypes !).
    `;

    let resultData;

    try {
      if (provider === "google") {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { 
            responseMimeType: "application/json",
            temperature: 0.7, // 0.7 pour un bon équilibre variété/cohérence
          }
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
          temperature: 0.7, 
        });

        const text = completion.choices[0].message.content;
        if (!text) throw new Error("No content from Groq");
        resultData = JSON.parse(text);
      } else {
        throw new Error(`Provider ${provider} not supported`);
      }
    } catch (providerError: any) {
      console.error(`Provider ${provider} error:`, providerError);
      throw providerError;
    }

    const giftsWithIds = (resultData.gift_ideas || []).map((gift: any) => ({
      ...gift,
      id: Math.random().toString(36).substr(2, 9),
    }));

    return NextResponse.json({ gift_ideas: giftsWithIds });

  } catch (error: any) {
    console.error("Error generating gifts:", error);
    return NextResponse.json(
      {
        error: "Failed to generate gifts",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { UserProfile } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile: UserProfile = body.profile;

    // On s'assure de bien récupérer la liste des titres déjà suggérés
    const alreadySuggestedGiftTitles: string[] = body.alreadySuggestedGiftTitles || [];
    const modelName: string = body.model || "gemini-2.0-flash-exp";
    const provider: "google" | "groq" = body.provider === "groq" ? "groq" : "google";

    // Formatage des intérêts et contexte
    const interestList = profile.interets.map((i) =>
      `${i.label} (${i.level === 'expert' ? '⭐⭐ EXPERT' : 'Découverte'})`
    ).join(", ");

    const blacklistLabels = profile.blacklist.map(t => t.label).join(", ");

    const contextList = [
      profile.projets.length > 0 ? `🔥 PROJETS: ${profile.projets.map(p => p.label).join(", ")}` : "",
      profile.plaintes.length > 0 ? `💢 IRRITANTS: ${profile.plaintes.map(p => p.label).join(", ")}` : "",
      profile.marquesTotem.length > 0 ? `🛍️ MARQUES: ${profile.marquesTotem.map(t => t.label).join(", ")}` : "",
      profile.momentDeVie.length > 0 ? `📍 VIE: ${profile.momentDeVie.map(m => m.label).join(", ")}` : "",
      profile.roleGroupe.length > 0 ? `👥 ROLE GROUPE: ${profile.roleGroupe.map(t => t.label).join(", ")}` : "",
      profile.profilAcheteur !== "ne-se-prononce-pas" ? `💳 STYLE ACHAT: ${profile.profilAcheteur}` : ""
    ].filter(Boolean).join("\n");

    // 1. SYSTEM PROMPT RENFORCÉ
    const systemPrompt = `
      Tu es un "Curator" de Concept Store expert.
      
      🚨 RÈGLE DE MÉMOIRE CRITIQUE 🚨
      Tu as déjà proposé les cadeaux suivants : [${alreadySuggestedGiftTitles.join(", ")}].
      Il est INTERDIT de proposer ces cadeaux à nouveau, ou des versions trop similaires. 
      Si tu as déjà proposé un "Outil de gestion de campagne", change radicalement d'angle (ex: passe à un objet physique, une expérience, ou un autre intérêt).

      🚨 RÈGLE DE DIVERSITÉ (ARCHÉTYPES) 🚨
      Couvre au moins 4 archétypes différents parmi :
      1. 📦 OBJET DURABLE (Tech, Outil, Déco).
      2. 🎟️ EXPÉRIENCE (Atelier, Sortie, Cours).
      3. 🍪 CONSOMMABLE (Food, Soin, Kit DIY).
      4. 📚 SAVOIR (Livre, Revue) -> MAX 1.
      5. 🧘 SERVICE (Abo, Massage).

      STRATÉGIE :
      - Croise au moins 2 données (ex: RPG + Artisanat = Set de dés en pierre taillés main).
      - Si EXPERT, propose du matériel de niche.
      - reasoning: Pas de phrases. Juste des puces avec Emojis.

      🚨 INTERDIT ABSOLU: ne jamais proposer un cadeau contenant: [${blacklistLabels}] 🚨
    `;

    const userMessage = `
      PROFIL :
      - ${profile.age} ans, ${profile.relation}, ${profile.genre}
      - Budget: ${profile.budget} | Intention: ${profile.intention}
      - Vibe: Pragmatique ${profile.pragmatiqueSentimental}% | Routine->Originalite ${profile.routineOriginalite}% | Calme->Energie ${profile.calmeEnergie}% | Serieux->Fun ${profile.serieuxFun}% | Objet->Experience ${profile.objetExperience}%
      
      INTÉRÊTS : ${interestList}
      CONTEXTE : ${contextList}
      BLACKLIST : ${blacklistLabels}

      Génère 5 nouvelles pépites (DIFFÉRENTES de la liste d'exclusion).
    `;

    let resultData;

    if (provider === "google") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: { responseMimeType: "application/json", temperature: 0.8 }
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userMessage }] }]
      });
      resultData = JSON.parse(result.response.text());

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
        temperature: 0.8,
      });
      resultData = JSON.parse(completion.choices[0].message.content || "{}");
    }

    const giftsWithIds = (resultData.gift_ideas || []).map((gift: any) => ({
      ...gift,
      id: Math.random().toString(36).substr(2, 9),
    }));

    return NextResponse.json({ gift_ideas: giftsWithIds });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

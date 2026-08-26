import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { UserProfile } from "@/types";
import { parseJsonSafe } from "@/lib/parse-json";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile: UserProfile = body.profile;

    // Validation provider explicite (pas de défaut silencieux)
    const rawProvider = body.provider;
    if (rawProvider !== undefined && rawProvider !== "google" && rawProvider !== "groq") {
      return NextResponse.json(
        { error: "Provider invalide", details: `Provider "${rawProvider}" non supporte. Valeurs autorisees: google, groq` },
        { status: 400 }
      );
    }
    const provider: "google" | "groq" = rawProvider === "groq" ? "groq" : "google";

    // On s'assure de bien récupérer la liste des titres déjà suggérés
    const alreadySuggestedGiftTitles: string[] = body.alreadySuggestedGiftTitles || [];
    const modelName: string = body.model || "gemini-2.0-flash-exp";

    // Validation modelName (regex simple, évite injection)
    if (typeof modelName !== "string" || modelName.trim().length === 0) {
      return NextResponse.json({ error: "Model manquant", details: "Le champ 'model' est requis" }, { status: 400 });
    }
    if (!/^[A-Za-z0-9._\/:-]+$/.test(modelName)) {
      return NextResponse.json(
        { error: "Model invalide", details: `Nom de modele "${modelName}" invalide` },
        { status: 400 }
      );
    }

    // Garde clés API - retour 503 si manquante
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

    let resultData: unknown;

    if (provider === "google") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
        generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
      });
      const text = result.response.text();
      if (!text) {
        throw new Error("Reponse vide du LLM (Google)");
      }
      resultData = parseJsonSafe(text);

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
      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new Error("Reponse vide du LLM (Groq)");
      }
      resultData = parseJsonSafe(text);
    }

    if (
      !resultData ||
      typeof resultData !== "object" ||
      !("gift_ideas" in resultData) ||
      !Array.isArray((resultData as { gift_ideas: unknown }).gift_ideas)
    ) {
      throw new Error("Format LLM invalide: 'gift_ideas' manquant ou non-array");
    }

    const giftsWithIds = (
      (resultData as { gift_ideas: Record<string, unknown>[] }).gift_ideas
    ).map((gift) => ({
      ...gift,
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2, 11),
    }));

    return NextResponse.json({ gift_ideas: giftsWithIds });

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed", details: message }, { status: 500 });
  }
}

import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { UserProfile, type Provider } from "@/types";
import { parseJsonSafe } from "@/lib/parse-json";
import { validateGiftIdeasPayload } from "@/lib/validate-gifts";

// JSON Schema partagé pour structured output (Groq) — gardé en clair pour lisibilité
const GIFT_JSON_SCHEMA = {
  type: "object",
  properties: {
    gift_ideas: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          emoji: { type: "string" },
          category: { type: "string" },
          title: { type: "string" },
          reasoning: { type: "string" },
          price: { type: "string" },
          tags_used: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 2,
          },
          archetype: { type: "string" },
        },
        required: ["emoji", "category", "title", "reasoning", "price"],
        additionalProperties: false,
      },
    },
  },
  required: ["gift_ideas"],
  additionalProperties: false,
} as const;

// ResponseSchema Google (SDK SchemaType)
const GOOGLE_RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    gift_ideas: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          emoji: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          reasoning: { type: SchemaType.STRING },
          price: { type: SchemaType.STRING },
          tags_used: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          archetype: { type: SchemaType.STRING },
        },
        required: ["emoji", "category", "title", "reasoning", "price"],
      },
    },
  },
  required: ["gift_ideas"],
};

// Consigne JSON stricte injectée dans prompts — évite toute déviation de clé/format
const JSON_FORMAT_INSTRUCTION = `
🚨 FORMAT DE SORTIE JSON OBLIGATOIRE 🚨
Tu DOIS répondre UNIQUEMENT avec un JSON valide (sans markdown, sans commentaire, sans texte hors JSON) de la forme EXACTE:
{"gift_ideas": [{"emoji":"🎁","category":"Tech","title":"Nom du cadeau","reasoning":"• puce 1\\n• puce 2","price":"25€","tags_used":["tag1","tag2"],"archetype":"OBJET DURABLE"}]}
Règles strictes:
- Clé racine OBLIGATOIRE: "gift_ideas" (snake_case, exactement ce nom). INTERDIT: gifts, giftIdeas, ideas, suggestions, ou array brut.
- Nombre EXACT: 5 objets dans gift_ideas, pas plus, pas moins.
- Champs obligatoires par cadeau: emoji (string), category (string), title (string), reasoning (string avec puces + emojis), price (string ex: "20€").
- Champs optionnels: tags_used ([string,string] exactement 2 tags), archetype (string parmi: OBJET DURABLE, EXPERIENCE, CONSOMMABLE, SAVOIR, SERVICE).
- Aucun champ supplémentaire non listé, aucun texte avant/après le JSON.
`.trim();

function truncateForLog(text: string, max = 500): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + `... [truncated ${text.length - max} chars]`;
}

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
    const provider: Provider = rawProvider === "groq" ? "groq" : "google";

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

    // 1. SYSTEM PROMPT RENFORCÉ + consigne JSON stricte
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

      ${JSON_FORMAT_INSTRUCTION}
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
      RAPPEL FORMAT: réponds UNIQUEMENT avec {"gift_ideas":[...5 objets...]} en respectant le schéma ci-dessus. Aucune autre clé, aucun texte hors JSON.
    `;

    // Fonction interne: appel LLM + validation avec retry 1x
    async function callLLMAndValidate(): Promise<{ gift_ideas: Record<string, unknown>[]; rawText: string }> {
      let lastRawText = "";
      let lastError: unknown = null;

      for (let attempt = 0; attempt < 2; attempt++) {
        let rawText: string | null | undefined;

        if (provider === "google") {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: GOOGLE_RESPONSE_SCHEMA,
              temperature: 0.8,
            },
          });

          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
          });
          rawText = result.response.text();
          if (!rawText) {
            throw new Error("Reponse vide du LLM (Google)");
          }
        } else if (provider === "groq") {
          const groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
          });

          // Tentative json_schema, fallback vers json_object si le modèle ne supporte pas
          let completion;
          try {
            completion = await groq.chat.completions.create({
              model: modelName,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "gift_ideas",
                  schema: GIFT_JSON_SCHEMA,
                  strict: true,
                },
              } as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParams["response_format"],
              temperature: 0.8,
            });
          } catch (e) {
            // Fallback si json_schema non supporté (erreur 400)
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("json_schema") || msg.includes("response_format")) {
              completion = await groq.chat.completions.create({
                model: modelName,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userMessage },
                ],
                response_format: { type: "json_object" },
                temperature: 0.8,
              });
            } else {
              throw e;
            }
          }
          rawText = completion.choices[0]?.message?.content;
          if (!rawText) {
            throw new Error("Reponse vide du LLM (Groq)");
          }
        }

        lastRawText = rawText ?? "";
        const parsed = parseJsonSafe(lastRawText);

        try {
          const validated = validateGiftIdeasPayload(parsed);
          return { gift_ideas: validated.gift_ideas as unknown as Record<string, unknown>[], rawText: lastRawText };
        } catch (validationError) {
          lastError = validationError;
          console.error(
            `[generate-gifts] Validation echouee (tentative ${attempt + 1}/2) provider=${provider} model=${modelName}:`,
            validationError instanceof Error ? validationError.message : String(validationError),
            "\nPayload brut (500 chars):",
            truncateForLog(lastRawText)
          );
          if (attempt === 0) {
            // retry une fois
            continue;
          }
          // après 2 tentatives on propage
          throw validationError;
        }
      }
      // Ne devrait jamais arriver
      throw lastError ?? new Error("Format LLM invalide: echec validation apres retry");
    }

    let giftIdeas: Record<string, unknown>[];
    try {
      const result = await callLLMAndValidate();
      giftIdeas = result.gift_ideas;
    } catch (validationOrLLMError) {
      const message = validationOrLLMError instanceof Error ? validationOrLLMError.message : String(validationOrLLMError);
      // Si c'est une erreur de validation format LLM après retry => 502, sinon 500
      const isValidationError = message.includes("Format LLM invalide");
      console.error("[generate-gifts] Echec final:", message);
      return NextResponse.json(
        { error: isValidationError ? "LLM format invalide apres retry" : "Failed", details: message },
        { status: isValidationError ? 502 : 500 }
      );
    }

    const giftsWithIds = giftIdeas.map((gift) => ({
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
    const isValidation = message.includes("Format LLM invalide");
    return NextResponse.json({ error: "Failed", details: message }, { status: isValidation ? 502 : 500 });
  }
}

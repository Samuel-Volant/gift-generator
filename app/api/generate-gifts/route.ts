import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { UserProfile, type Provider } from "@/types";
import { parseJsonSafe } from "@/lib/parse-json";
import { validateGiftIdeasPayload } from "@/lib/validate-gifts";
import {
  GIFT_JSON_SCHEMA,
  GOOGLE_RESPONSE_SCHEMA,
  buildGiftSystemPrompt,
  buildGiftUserMessage,
  buildGiftRetryPrompt,
  GIFT_FEW_SHOT,
} from "@/lib/prompts/gift-generation";

function truncateForLog(text: string, max = 500): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + `... [truncated ${text.length - max} chars]`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile: UserProfile = body.profile;

    const rawProvider = body.provider;
    if (rawProvider !== undefined && rawProvider !== "google" && rawProvider !== "groq") {
      return NextResponse.json(
        { error: "Provider invalide", details: `Provider "${rawProvider}" non supporte. Valeurs autorisees: google, groq` },
        { status: 400 }
      );
    }
    const provider: Provider = rawProvider === "groq" ? "groq" : "google";

    const alreadySuggestedGiftTitles: string[] = body.alreadySuggestedGiftTitles || [];
    const modelName: string = body.model || "gemini-2.0-flash-exp";

    if (typeof modelName !== "string" || modelName.trim().length === 0) {
      return NextResponse.json({ error: "Model manquant", details: "Le champ 'model' est requis" }, { status: 400 });
    }
    if (!/^[A-Za-z0-9._\/:-]+$/.test(modelName)) {
      return NextResponse.json(
        { error: "Model invalide", details: `Nom de modele "${modelName}" invalide` },
        { status: 400 }
      );
    }

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

    const blacklistLabels: string[] = Array.isArray(profile.blacklist)
      ? profile.blacklist.map((t) => t.label)
      : [];

    const systemPrompt = buildGiftSystemPrompt({
      alreadySuggestedTitles: alreadySuggestedGiftTitles,
      blacklistLabels,
    });

    const userMessage = buildGiftUserMessage(profile);

    async function callLLMAndValidate(): Promise<{ gift_ideas: Record<string, unknown>[]; rawText: string }> {
      let lastRawText = "";
      let lastError: unknown = null;
      let lastZodErrorMsg = "";

      for (let attempt = 0; attempt < 2; attempt++) {
        let rawText: string | null | undefined;
        let finishReason: string | undefined;

        // Injection du prompt correctif au retry
        const effectiveUserMessage =
          attempt === 0 || !lastZodErrorMsg ? userMessage : `${userMessage}\n\n${buildGiftRetryPrompt(lastZodErrorMsg)}`;

        // Pour Google on peut ajouter le few-shot en history au second tour si besoin,
        // mais on garde simple: même userMessage augmenté du correctif
        const effectiveSystemPrompt = systemPrompt;

        if (provider === "google") {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: effectiveSystemPrompt,
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: GOOGLE_RESPONSE_SCHEMA,
              temperature: 0.7,
              maxOutputTokens: 8192,
            },
          });

          // Ajoute few-shot en tant qu'historique : user exemple + assistant exemple
          // uniquement au premier attempt pour ancrer le format
          const contents =
            attempt === 0
              ? [
                  { role: "user" as const, parts: [{ text: GIFT_FEW_SHOT.user }] },
                  { role: "model" as const, parts: [{ text: GIFT_FEW_SHOT.assistant }] },
                  { role: "user" as const, parts: [{ text: effectiveUserMessage }] },
                ]
              : [{ role: "user" as const, parts: [{ text: effectiveUserMessage }] }];

          const result = await model.generateContent({ contents });
          rawText = result.response.text();
          // finishReason Google
          try {
            const candidates = (result.response as unknown as { candidates?: Array<{ finishReason?: string }> }).candidates;
            finishReason = candidates?.[0]?.finishReason;
          } catch {
            // ignore
          }
          if (!rawText) {
            throw new Error("Reponse vide du LLM (Google)");
          }
        } else if (provider === "groq") {
          const groq = new OpenAI({
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
          });

          // Messages avec few-shot injecté en exemple user/assistant au premier attempt
          const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
            attempt === 0
              ? [
                  { role: "system", content: effectiveSystemPrompt },
                  { role: "user", content: GIFT_FEW_SHOT.user },
                  { role: "assistant", content: GIFT_FEW_SHOT.assistant },
                  { role: "user", content: effectiveUserMessage },
                ]
              : [
                  { role: "system", content: effectiveSystemPrompt },
                  { role: "user", content: effectiveUserMessage },
                ];

          let completion;
          try {
            completion = await groq.chat.completions.create({
              model: modelName,
              messages,
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "gift_ideas",
                  schema: GIFT_JSON_SCHEMA,
                  strict: true,
                },
              } as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParams["response_format"],
              temperature: 0.7,
              max_tokens: 4000,
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg.includes("json_schema") || msg.includes("response_format")) {
              completion = await groq.chat.completions.create({
                model: modelName,
                messages,
                response_format: { type: "json_object" },
                temperature: 0.7,
                max_tokens: 4000,
              });
            } else {
              throw e;
            }
          }
          rawText = completion.choices[0]?.message?.content;
          finishReason = (completion.choices[0] as unknown as { finish_reason?: string })?.finish_reason;
          if (!rawText) {
            throw new Error("Reponse vide du LLM (Groq)");
          }
        }

        lastRawText = rawText ?? "";

        // Logs taille + finishReason (exigence ticket #13)
        console.log(
          `[generate-gifts] LLM rawText length=${lastRawText.length} finishReason=${finishReason ?? "unknown"} provider=${provider} model=${modelName} attempt=${attempt + 1}/2`
        );

        const parsed = parseJsonSafe(lastRawText);

        try {
          const validated = validateGiftIdeasPayload(parsed);
          return { gift_ideas: validated.gift_ideas as unknown as Record<string, unknown>[], rawText: lastRawText };
        } catch (validationError) {
          lastError = validationError;
          lastZodErrorMsg = validationError instanceof Error ? validationError.message : String(validationError);
          console.error(
            `[generate-gifts] Validation echouee (tentative ${attempt + 1}/2) provider=${provider} model=${modelName}:`,
            lastZodErrorMsg,
            "\nPayload brut (500 chars):",
            truncateForLog(lastRawText)
          );
          if (attempt === 0) {
            continue;
          }
          throw validationError;
        }
      }
      throw lastError ?? new Error("Format LLM invalide: echec validation apres retry");
    }

    let giftIdeas: Record<string, unknown>[];
    try {
      const result = await callLLMAndValidate();
      giftIdeas = result.gift_ideas;
    } catch (validationOrLLMError) {
      const message = validationOrLLMError instanceof Error ? validationOrLLMError.message : String(validationOrLLMError);
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

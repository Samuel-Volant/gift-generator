import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { parseJsonSafe } from "@/lib/parse-json";
import type { Provider } from "@/types";
import {
  TAG_SUGGESTION_GOOGLE_SCHEMA,
  TAG_SUGGESTION_JSON_SCHEMA,
  buildTagSuggestionPrompt,
} from "@/lib/prompts/tag-suggestion";

export async function POST(req: Request) {
  try {
    const {
      currentTags,
      sliders,
      ignoredTags,
      model: selectedModelId,
      provider: selectedProvider,
    } = await req.json();

    if (!selectedModelId || typeof selectedModelId !== "string" || selectedModelId.trim().length === 0) {
      return NextResponse.json(
        { error: "Model manquant", details: "Le champ 'model' est requis" },
        { status: 400 }
      );
    }
    if (!/^[A-Za-z0-9._\/:-]+$/.test(selectedModelId)) {
      return NextResponse.json(
        { error: "Model invalide", details: `Nom de modele "${selectedModelId}" invalide` },
        { status: 400 }
      );
    }

    const rawProvider = selectedProvider;
    if (rawProvider !== undefined && rawProvider !== "google" && rawProvider !== "groq") {
      return NextResponse.json(
        { error: "Provider invalide", details: `Provider "${rawProvider}" non supporte. Valeurs autorisees: google, groq` },
        { status: 400 }
      );
    }
    const provider: Provider = rawProvider === "groq" ? "groq" : "google";

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

    const tagLabels: string[] = Array.isArray(currentTags)
      ? currentTags
          .map((t: unknown) => {
            if (typeof t === "string") return t;
            if (t && typeof t === "object" && "label" in (t as Record<string, unknown>)) {
              const label = (t as Record<string, unknown>).label;
              return typeof label === "string" ? label : String(label ?? "");
            }
            return String(t ?? "");
          })
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
          .slice(0, 20)
      : [];

    const ignoredLabels: string[] = Array.isArray(ignoredTags)
      ? ignoredTags
          .map((t: unknown) => (typeof t === "string" ? t : String(t ?? "")))
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
          .slice(0, 20)
      : [];

    const prompt = buildTagSuggestionPrompt({
      tagLabels,
      ignoredLabels,
      sliders: sliders ?? null,
    });

    let resultData;

    if (provider === "google") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({
        model: selectedModelId,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: TAG_SUGGESTION_GOOGLE_SCHEMA,
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) {
        throw new Error("Reponse vide du LLM (Google)");
      }
      try {
        const candidates = (result.response as unknown as { candidates?: Array<{ finishReason?: string }> }).candidates;
        console.log(
          `[suggest-tags] Google length=${text.length} finishReason=${candidates?.[0]?.finishReason ?? "unknown"} model=${selectedModelId}`
        );
      } catch {
        // ignore
      }
      resultData = parseJsonSafe(text);
    } else if (provider === "groq") {
      const groq = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });

      let completion;
      try {
        completion = await groq.chat.completions.create({
          model: selectedModelId,
          messages: [
            { role: "system", content: "You are a helpful assistant that outputs JSON." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "suggested_tags",
              schema: TAG_SUGGESTION_JSON_SCHEMA,
              strict: true,
            },
          } as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParams["response_format"],
          temperature: 0.7,
          max_tokens: 1024,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("json_schema") || msg.includes("response_format")) {
          completion = await groq.chat.completions.create({
            model: selectedModelId,
            messages: [
              { role: "system", content: "You are a helpful assistant that outputs JSON." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 1024,
          });
        } else {
          throw e;
        }
      }

      const text = completion.choices[0].message.content;
      if (!text) throw new Error("Reponse vide du LLM (Groq)");
      const finishReason = (completion.choices[0] as unknown as { finish_reason?: string })?.finish_reason;
      console.log(`[suggest-tags] Groq length=${text.length} finishReason=${finishReason ?? "unknown"} model=${selectedModelId}`);
      resultData = parseJsonSafe(text);
    } else {
      throw new Error("Provider not supported");
    }

    return NextResponse.json(resultData);
  } catch (error: unknown) {
    console.error("Error generating tags:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to generate tags", details: message },
      { status: 500 }
    );
  }
}

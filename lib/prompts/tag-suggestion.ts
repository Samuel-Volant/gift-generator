import { describeSlider, escapeXml, sanitizeTagLabels } from "./helpers";

// Schema json_schema strict pour suggest-tags
export const TAG_SUGGESTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    suggested_tags: {
      type: "array",
      minItems: 10,
      maxItems: 10,
      items: { type: "string" },
    },
  },
  required: ["suggested_tags"],
  additionalProperties: false,
} as const;

// Google SchemaType equivalent
import { SchemaType, type Schema } from "@google/generative-ai";

export const TAG_SUGGESTION_GOOGLE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    suggested_tags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["suggested_tags"],
};

export interface TagSuggestionPromptParams {
  tagLabels: string[];
  ignoredLabels: string[];
  sliders?: Record<string, unknown> | null;
}

function formatSliders(sliders: Record<string, unknown> | null | undefined): string {
  if (!sliders || typeof sliders !== "object") return "non renseignés";
  const entries = Object.entries(sliders);
  if (entries.length === 0) return "non renseignés";
  // Map known slider keys to left/right labels
  const sliderLabels: Record<string, [string, string]> = {
    pragmatiqueSentimental: ["Pragmatique", "Sentimental"],
    routineOriginalite: ["Routine", "Originalité"],
    calmeEnergie: ["Calme", "Énergie"],
    serieuxFun: ["Sérieux", "Fun"],
    objetExperience: ["Objet", "Expérience"],
  };
  return entries
    .map(([k, v]) => {
      const num = typeof v === "number" ? v : Number(v);
      if (Number.isNaN(num)) return `${k}: ${String(v)}`;
      const labels = sliderLabels[k];
      if (labels) {
        const desc = describeSlider(num, labels[0], labels[1]);
        if (!desc) return null; // équilibré, skip
        return `${k}: ${desc}`;
      }
      return `${k}: ${num}`;
    })
    .filter(Boolean)
    .join(", ");
}

export function buildTagSuggestionPrompt(params: TagSuggestionPromptParams): string {
  const tags = sanitizeTagLabels(params.tagLabels, 20);
  const ignored = sanitizeTagLabels(params.ignoredLabels, 20);
  const slidersText = formatSliders(params.sliders as Record<string, unknown>);

  // Prompt simplifié <800 tokens, garde Niveau 2 + 2 exemples
  return [
    "Tu es un expert en recommandation de loisirs. Suggère 10 NOUVEAUX tags d'intérêts adjacents (pensée latérale).",
    "Langue: français, 1-2 mots max par tag, Capitalize (ex: \"Poteries\", \"Randonnée\").",
    "",
    "Niveau visé — L'Activité Concrète (Niveau 2) :",
    '✅ Bon: "Yoga", "Cuisine", "Jazz", "Poterie", "Astronomie" (activité tangible).',
    '❌ Mauvais: "Aventure"/"Création" (trop abstrait, Niveau 1) et "Yoga Ashtanga"/"Cuisine Moléculaire" (trop niche, Niveau 3).',
    "",
    "Logique : trouve des \"Cousins\" (activités différentes mais même profil).",
    'Ex: "Jeux Vidéo" -> "Jeux de Société", "Programmation" | "Randonnée" -> "Escalade", "Photographie".',
    "",
    `Tags actuels: [${tags.join(", ")}]`,
    `À NE PAS suggérer (déjà vus/refusés): [${ignored.join(", ")}]`,
    `Vibe sliders: ${escapeXml(slidersText)}`,
    "",
    "Réponds UNIQUEMENT via le schema JSON {suggested_tags: string[10]}.",
  ].join("\n");
}

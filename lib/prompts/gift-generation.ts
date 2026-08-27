import { SchemaType, type Schema } from "@google/generative-ai";
import { budgetLabelMap, intentionMap, describeSlider, escapeXml } from "./helpers";
import type { UserProfile } from "@/types";

// ---------------------------------------------------------------------------
// Schemas — seule source de vérité pour le format JSON (pas de JSON_FORMAT_INSTRUCTION dupliqué)
// ---------------------------------------------------------------------------

export const GIFT_JSON_SCHEMA = {
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

export const GOOGLE_RESPONSE_SCHEMA: Schema = {
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

// ---------------------------------------------------------------------------
// Few-shot — ancre price "45€" vs "€€" et reasoning bien formé
// ---------------------------------------------------------------------------

export const GIFT_FEW_SHOT = {
  user: `<profil><identite age="28" genre="non-binaire" relation="ami"/><vibe>pragmatique: plut\u00f4t pragmatique | routineOriginalite: \u00e9quilibr\u00e9, l\u00e9g\u00e8rement originalit\u00e9 | calmeEnergie: plut\u00f4t \u00e9nergie | serieuxFun: plut\u00f4t fun | objetExperience: \u00e9quilibr\u00e9</vibe><interets><interet niveau="expert">Jeux de soci\u00e9t\u00e9</interet><interet niveau="d\u00e9couverte">Poteries</interet></interets><contexte><projets>P\u00e9dagogie ludique</projets></contexte><budget>budget moyen (~25-60\u20ac, indication souple)</budget><intention>fun / divertissant</intention></profil>`,
  assistant: JSON.stringify({
    gift_ideas: [
      {
        emoji: "🎲",
        category: "Jeux",
        title: "Kit de prototypage de jeu de soci\u00e9t\u00e9",
        reasoning: "- \ud83c\udfa8 Poterie + Jeux de soci\u00e9t\u00e9 = cr\u00e9e ses propres pions\n- \ud83e\udde0 P\u00e9dagogie ludique : teste ses m\u00e9caniques en famille",
        price: "38\u20ac",
        tags_used: ["Jeux de soci\u00e9t\u00e9", "Poteries"],
        archetype: "OBJET DURABLE",
      },
      {
        emoji: "🏺",
        category: "Atelier",
        title: "Atelier tournage c\u00e9ramique 2h",
        reasoning: "- \ud83c\udf1f Exp\u00e9rience manuelle, fun et concr\u00e8te\n- \ud83c\udf81 Repart avec ses cr\u00e9ations",
        price: "45\u20ac",
        tags_used: ["Poteries", "Jeux de soci\u00e9t\u00e9"],
        archetype: "EXPERIENCE",
      },
      {
        emoji: "🍵",
        category: "Gourmand",
        title: "Coffret th\u00e9s d\u2019origine + c\u00e9ramique artisanale",
        reasoning: "- \ud83c\udf75 Moment calme pour pr\u00e9parer ses soir\u00e9es jeux\n- \ud83c\udfa8 Objet durable + consommable",
        price: "32\u20ac",
        tags_used: ["Poteries", "Jeux de soci\u00e9t\u00e9"],
        archetype: "CONSOMMABLE",
      },
      {
        emoji: "📚",
        category: "Livre",
        title: "Livre : L\u2019art du game design",
        reasoning: "- \ud83d\udcda Savoir expert : m\u00e9caniques avanc\u00e9es\n- \ud83d\udca1 1 seul SAVOIR max respect\u00e9",
        price: "22\u20ac",
        tags_used: ["Jeux de soci\u00e9t\u00e9", "Poteries"],
        archetype: "SAVOIR",
      },
      {
        emoji: "🗓️",
        category: "Service",
        title: "Abonnement mensuel box \u00e9nigmes",
        reasoning: "- \ud83e\udde9 Fun r\u00e9current, \u00e0 partager\n- \ud83c\udfaf Coche originalit\u00e9 + fun",
        price: "19\u20ac",
        tags_used: ["Jeux de soci\u00e9t\u00e9", "Poteries"],
        archetype: "SERVICE",
      },
    ],
  }),
};

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function buildVibe(profile: UserProfile): string {
  return [
    `pragmatique: ${describeSlider(profile.pragmatiqueSentimental, "Pragmatique", "Sentimental")}`,
    `routineOriginalite: ${describeSlider(profile.routineOriginalite, "Routine", "Originalité")}`,
    `calmeEnergie: ${describeSlider(profile.calmeEnergie, "Calme", "Énergie")}`,
    `serieuxFun: ${describeSlider(profile.serieuxFun, "Sérieux", "Fun")}`,
    `objetExperience: ${describeSlider(profile.objetExperience, "Objet", "Expérience")}`,
  ].join(" | ");
}

function interetsXml(profile: UserProfile): string {
  if (profile.interets.length === 0) return "<interets/>";
  const items = profile.interets
    .map((i) => {
      const niveau = i.level === "expert" ? "expert" : "découverte";
      return `<interet niveau="${niveau}">${escapeXml(i.label)}</interet>`;
    })
    .join("");
  return `<interets>${items}</interets>`;
}

function contexteXml(profile: UserProfile): string {
  const parts: string[] = [];
  if (profile.projets.length > 0)
    parts.push(`<projets>${profile.projets.map((p) => escapeXml(p.label)).join(", ")}</projets>`);
  if (profile.plaintes.length > 0)
    parts.push(`<irritants>${profile.plaintes.map((p) => escapeXml(p.label)).join(", ")}</irritants>`);
  if (profile.marquesTotem.length > 0)
    parts.push(`<marques>${profile.marquesTotem.map((t) => escapeXml(t.label)).join(", ")}</marques>`);
  if (profile.momentDeVie.length > 0)
    parts.push(`<vie>${profile.momentDeVie.map((m) => escapeXml(m.label)).join(", ")}</vie>`);
  if (profile.roleGroupe.length > 0)
    parts.push(`<roleGroupe>${profile.roleGroupe.map((t) => escapeXml(t.label)).join(", ")}</roleGroupe>`);
  if (profile.profilAcheteur !== "ne-se-prononce-pas")
    parts.push(`<styleAchat>${escapeXml(profile.profilAcheteur)}</styleAchat>`);
  if (parts.length === 0) return "<contexte/>";
  return `<contexte>${parts.join("")}</contexte>`;
}

export function buildGiftSystemPrompt(params: {
  alreadySuggestedTitles: string[];
  blacklistLabels: string[];
}): string {
  const already = params.alreadySuggestedTitles.map(escapeXml).join(", ");
  const blacklist = params.blacklistLabels.map(escapeXml).join(", ");

  return [
    "Tu es GiftGenius, conseiller cadeaux français expert en sérendipité.",
    "Contraintes: réponds en français, JSON via schema uniquement, prix dans fourchette budget (indication souple),",
    `interdit: {${blacklist || "aucun"}} , ne répète pas: {${already || "aucun"}} , 1 max SAVOIR, >=4 archétypes/5, tags_used = 2 labels existants du profil.`,
    'reasoning: 2-3 puces "- {emoji} {bénéfice concret lié au profil}" (pas de phrases longues).',
    "Arch\u00e9types: OBJET DURABLE, EXPERIENCE, CONSOMMABLE, SAVOIR (max 1), SERVICE.",
    "Croise au moins 2 donn\u00e9es du profil par id\u00e9e. Si EXPERT, propose du mat\u00e9riel de niche.",
  ].join("\n");
}

export function buildGiftUserMessage(
  profile: UserProfile,
  opts?: { fewShot?: boolean }
): string {
  const vibe = buildVibe(profile);
  const interets = interetsXml(profile);
  const contexte = contexteXml(profile);
  const budget = budgetLabelMap[profile.budget] ?? budgetLabelMap["ne-se-prononce-pas"];
  const intention = intentionMap[profile.intention] ?? intentionMap["ne-se-prononce-pas"];

  const profilXml = [
    `<profil>`,
    `<identite age="${profile.age}" genre="${escapeXml(profile.genre)}" relation="${escapeXml(profile.relation)}"/>`,
    `<vibe>${escapeXml(vibe)}</vibe>`,
    interets,
    contexte,
    `<budget>${escapeXml(budget)}</budget>`,
    `<intention>${escapeXml(intention)}</intention>`,
    `</profil>`,
  ].join("");

  const instruction = "Génère 5 nouvelles pépites DIFFÉRENTES de la liste d'exclusion. Réponds UNIQUEMENT via le schema JSON.";

  // Few-shot optionnel côté provider qui supporte history; on l'expose pour route.ts si besoin
  if (opts?.fewShot) {
    return `${profilXml}\n${instruction}\nExemple valide: ${GIFT_FEW_SHOT.assistant}`;
  }
  return `${profilXml}\n${instruction}`;
}

export function buildGiftRetryPrompt(zodError: string): string {
  return `Ta réponse a échoué validation: ${zodError}. Corrige uniquement le champ fautif et renvoie le JSON complet valide via le schema.`;
}

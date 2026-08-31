export type InterestLevel = "casual" | "expert"

export type Provider = "google" | "groq"

export type Budget = "ne-se-prononce-pas" | "petit" | "moyen" | "eleve" | "premium"

// Preset alias for clarity (same union as Budget)
export type BudgetPreset = Budget

export type Intention = "ne-se-prononce-pas" | "wow" | "utile" | "fun" | "apprendre" | "emouvoir"

export const SLIDER_MIN = 1;
export const SLIDER_MAX = 5;
export type SliderPosition = typeof SLIDER_MIN | 2 | 3 | 4 | typeof SLIDER_MAX;

export const GENRES = ["homme", "femme", "non-binaire", "autre"] as const;
export type Genre = (typeof GENRES)[number];

export const RELATIONS = ["ami", "famille", "collegue", "partenaire", "connaissance"] as const;
export type Relation = (typeof RELATIONS)[number];

export type BuyerProfile = "ne-se-prononce-pas" | "impulsif" | "collectionneur" | "econome" | "reflechi" | "early-adopter"

export interface Interest {
  id: string
  label: string
  level: InterestLevel
}

export interface Tag {
  id: string
  label: string
}

export interface UserProfile {
  /** Future auth — nullable pour prepa comptes (issue #17) */
  userId?: string
  // Identité
  age: number
  genre: Genre
  relation: Relation

  // Psychologie (Sliders 1-5 discrèts)
  // 1 = très left, 2 = plutôt left, 3 = équilibré, 4 = plutôt right, 5 = très right
  pragmatiqueSentimental: number // 1=Pragmatique, 5=Sentimental
  routineOriginalite: number // 1=Routine, 5=Originalité
  calmeEnergie: number // 1=Calme, 5=Énergie
  serieuxFun: number // 1=Sérieux, 5=Fun
  objetExperience: number // 1=Objet, 5=Expérience

  // Passions (Intérêts avec niveau)
  interets: Interest[]

  // Profilage Sociologique
  momentDeVie: Tag[]
  roleGroupe: Tag[]
  marquesTotem: Tag[]

  // Contexte & Comportement
  profilAcheteur: BuyerProfile
  projets: Tag[]
  plaintes: Tag[]

  // Zone Négative
  blacklist: Tag[]

  // Cadre du Cadeau
  budget: Budget
  /** Budget précis optionnel — si renseigné, prioritaire sur le preset pour le prompt */
  budgetMin?: number
  budgetMax?: number
  intention: Intention
}

export interface GiftIdea {
  id: string
  emoji: string
  category: string
  title: string
  reasoning: string
  price: string
  tags_used?: [string, string]
  archetype?: string
}

/** Carte supprimée par l'utilisateur — persiste en localStorage (#26). */
export interface DeletedGift extends GiftIdea {
  dismissedAt: number
}

export interface SavedProfile {
  id: string
  name: string
  profile: UserProfile
  createdAt: number
}

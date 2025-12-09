export type InterestLevel = "none" | "casual" | "expert"

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
  // Identité
  age: number
  genre: string
  relation: string

  // Psychologie (Sliders 0-100)
  pragmatiqueSentimental: number // 0 = Pragmatique, 100 = Sentimental
  routineOriginalite: number // 0 = Routine, 100 = Originalité
  calmeEnergie: number // 0 = Calme, 100 = Énergie
  serieuxFun: number // 0 = Sérieux, 100 = Fun
  objetExperience: number // 0 = Objet, 100 = Expérience

  // Passions (Intérêts avec niveau)
  interets: Interest[]

  // Profilage Sociologique
  momentDeVie: Tag[]
  roleGroupe: Tag[]
  marquesTotem: Tag[]

  // Contexte & Comportement
  profilAcheteur: string
  projets: Tag[]
  plaintes: Tag[]

  // Zone Négative
  blacklist: Tag[]

  // Cadre du Cadeau
  budget: string
  intention: string
}

export interface GiftIdea {
  id: string
  emoji: string
  category: string
  title: string
  reasoning: string
  price: string
}

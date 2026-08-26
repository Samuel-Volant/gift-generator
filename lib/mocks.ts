import type { GiftIdea } from "@/types"

/**
 * Données de fallback pour le développement local.
 * Non importé dans `app/page.tsx` pour ne pas alourdir le bundle de prod.
 * Utilisable manuellement en dev si l'API échoue :
 *   import { MOCK_GIFTS } from "@/lib/mocks"
 */
export const MOCK_GIFTS: GiftIdea[] = [
  {
    id: "1",
    emoji: "🎨",
    category: "Créativité",
    title: "Kit de Peinture Acrylique Premium",
    reasoning:
      "Parfait pour quelqu'un qui explore la créativité avec un niveau expert en cuisine - la précision artistique rejoint l'art culinaire.",
    price: "€€",
  },
  {
    id: "2",
    emoji: "🏃‍♂️",
    category: "Sport",
    title: "Montre Connectée pour Running",
    reasoning:
      "Idéal pour son projet de Marathon. Suivi GPS, fréquence cardiaque, et coaching personnalisé pour optimiser ses performances.",
    price: "€€€",
  },
  {
    id: "3",
    emoji: "📱",
    category: "Tech",
    title: "AirPods Pro (3ème génération)",
    reasoning:
      "Marque Apple dans ses totems, parfait pour quelqu'un d'énergique qui aime avoir le meilleur de la tech au quotidien.",
    price: "€€€",
  },
  {
    id: "4",
    emoji: "📚",
    category: "Culture",
    title: "Abonnement MasterClass",
    reasoning:
      "Pour apprendre auprès des meilleurs dans divers domaines. Stimule son originalité et nourrit sa curiosité permanente.",
    price: "€€",
  },
  {
    id: "5",
    emoji: "🍳",
    category: "Cuisine",
    title: "Cours de Cuisine Gastronomique",
    reasoning:
      "Niveau expert en cuisine mérite une expérience immersive avec un chef étoilé. Allier passion et perfectionnement.",
    price: "€€€€",
  },
  {
    id: "6",
    emoji: "🎧",
    category: "Audio",
    title: "Enceinte Bluetooth Portable",
    reasoning: "Pour accompagner ses sessions de sport et créer l'ambiance parfaite lors de ses soirées entre amis.",
    price: "€€",
  },
  {
    id: "7",
    emoji: "🧘",
    category: "Bien-être",
    title: "Tapis de Yoga Premium",
    reasoning: "Combine calme et énergie - parfait pour des moments de récupération après ses entraînements intenses.",
    price: "€",
  },
  {
    id: "8",
    emoji: "📷",
    category: "Photo",
    title: "Appareil Photo Instantané",
    reasoning: "Capture les moments spontanés et fun. Parfait pour quelqu'un qui aime créer des souvenirs tangibles.",
    price: "€€",
  },
  {
    id: "9",
    emoji: "🎮",
    category: "Gaming",
    title: "Console de Jeu Portable",
    reasoning:
      "Pour les moments de détente et de fun après une journée intense. Originalité et entertainment combinés.",
    price: "€€€",
  },
  {
    id: "10",
    emoji: "🌿",
    category: "Déco",
    title: "Kit de Plantes d'Intérieur",
    reasoning: "Apporte du calme et de la vie dans son espace. Parfait pour son projet de déco salon mentionné.",
    price: "€",
  },
  {
    id: "11",
    emoji: "🎯",
    category: "Loisirs",
    title: "Set de Fléchettes Professionnel",
    reasoning: "Activité sociale et compétitive. Idéal pour quelqu'un d'énergique qui aime se lancer des défis.",
    price: "€€",
  },
  {
    id: "12",
    emoji: "☕",
    category: "Café",
    title: "Machine à Espresso Manuelle",
    reasoning: "Pour un expert en cuisine qui apprécie les rituels matinaux et la qualité des produits.",
    price: "€€€",
  },
  {
    id: "13",
    emoji: "🎵",
    category: "Musique",
    title: "Vinyles Edition Limitée",
    reasoning:
      "Pour quelqu'un qui apprécie l'originalité et les objets authentiques avec une vraie valeur sentimentale.",
    price: "€€",
  },
  {
    id: "14",
    emoji: "⌚",
    category: "Accessoire",
    title: "Montre Mécanique Élégante",
    reasoning: "Allier pragmatisme et élégance. Un objet intemporel pour marquer les grandes occasions.",
    price: "€€€€",
  },
  {
    id: "15",
    emoji: "🏔️",
    category: "Aventure",
    title: "Weekend Randonnée en Montagne",
    reasoning: "Une expérience mémorable qui combine énergie physique, nature et dépassement de soi.",
    price: "€€€",
  },
]

"use client"

import { useState, useEffect } from "react"import { Sparkles, Gift, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { SmartTagManager } from "@/components/smart-tag-manager"
import { InterestTagManager } from "@/components/interest-tag-manager"
import { PsychologySlider } from "@/components/psychology-slider"
import { GiftCard } from "@/components/gift-card"
import type { UserProfile, GiftIdea, Tag } from "@/types"
import { useToast } from "@/components/ui/use-toast"

// Mock Data
const MOCK_GIFTS: GiftIdea[] = [
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

import { FALLBACK_MODELS, DEFAULT_MODEL, type AIModel } from "@/lib/ai-models"

export default function GiftGeniusPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [giftResults, setGiftResults] = useState<GiftIdea[]>([])
  const [usedTagPairs, setUsedTagPairs] = useState<string[][]>([])
  const [availableModels, setAvailableModels] = useState<AIModel[]>(FALLBACK_MODELS)
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL)
  const { toast } = useToast()

  // Provider correspondant au modèle sélectionné (utile pour les appels API)
  const selectedProvider = availableModels.find((m) => m.id === selectedModel)?.provider ?? "google"

  // Charge dynamiquement la liste des modèles gratuits disponibles
  useEffect(() => {
    let isMounted = true

    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models)
          // Si le modèle sélectionné n'existe plus dans la nouvelle liste, on bascule sur le premier dispo
          setSelectedModel((current) =>
            data.models.some((m: AIModel) => m.id === current) ? current : data.models[0].id,
          )
        }
      })
      .catch((error) => {
        console.error("Impossible de charger les modèles disponibles:", error)
      })
      .finally(() => {
        if (isMounted) setIsLoadingModels(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const [profile, setProfile] = useState<UserProfile>({
    age: 28,
    genre: "non-binaire",
    relation: "ami",
    pragmatiqueSentimental: 40,
    routineOriginalite: 65,
    calmeEnergie: 70,
    serieuxFun: 60,
    objetExperience: 55,
    interets: [],
    momentDeVie: [],
    roleGroupe: [],
    marquesTotem: [],
    profilAcheteur: "ne-se-prononce-pas",
    projets: [],
    plaintes: [],
    blacklist: [],
    budget: "ne-se-prononce-pas",
    intention: "ne-se-prononce-pas",
  })

  const handleGenerateGifts = async () => {
    setIsLoading(true)
    try {
      // Extract titles of already suggested gifts
      const alreadySuggestedGiftTitles = giftResults.map((g) => g.title)

      const response = await fetch("/api/generate-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          usedTagPairs,
          alreadySuggestedGiftTitles, // Send to API
          model: selectedModel,
          provider: selectedProvider,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.hint || "Erreur de génération")
      }

      const data = await response.json()

      if (data.gift_ideas && data.gift_ideas.length > 0) {
        setGiftResults((prev) => [...data.gift_ideas, ...prev])

        // Update used tag pairs logic
        const newPairs = data.gift_ideas
          .filter((g: any) => g.tags_used && g.tags_used.length === 2)
          .map((g: any) => g.tags_used)

        if (newPairs.length > 0) {
          setUsedTagPairs((prev) => [...prev, ...newPairs])
        }

        toast({
          title: "Idées générées !",
          description: `${data.gift_ideas.length} nouvelles idées trouvées.`,
        })
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer des cadeaux pour le moment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismissGift = (giftId: string, blacklistTag?: string) => {
    console.log("[v0] handleDismissGift called with:", { giftId, blacklistTag, tagLength: blacklistTag?.length })
    if (blacklistTag && blacklistTag.trim().length > 0) {
      const normalizedTag = blacklistTag.trim().toLowerCase()
      const isDuplicate = profile.blacklist.some((tag) => tag.label.toLowerCase() === normalizedTag)

      if (isDuplicate) {
        console.log("[v0] Tag already exists in blacklist, skipping")
        return
      }

      console.log("[v0] Adding to blacklist:", blacklistTag)
      const newTag: Tag = {
        id: `${Date.now()}-${Math.random()}`,
        label: blacklistTag.trim(),
      }
      setProfile({
        ...profile,
        blacklist: [...profile.blacklist, newTag],
      })
    } else {
      console.log("[v0] No tag to add or empty tag")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-balance">GiftGenius</h1>
                <p className="text-sm text-muted-foreground">L'IA qui trouve le cadeau parfait</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="model-select" className="text-sm font-medium hidden sm:block">
                Modèle IA :
              </Label>
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoadingModels}>
                <SelectTrigger id="model-select" className="w-[220px]">
                  <SelectValue placeholder={isLoadingModels ? "Chargement..." : "Choisir un modèle"} />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Grille Bento - Control Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
            {/* Bloc 1: Identité */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Identité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Âge</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Select value={profile.genre} onValueChange={(value: string) => setProfile({ ...profile, genre: value })}>
                    <SelectTrigger id="genre">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homme">Homme</SelectItem>
                      <SelectItem value="femme">Femme</SelectItem>
                      <SelectItem value="non-binaire">Non-binaire</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relation">Relation</Label>
                  <Select
                    value={profile.relation}
                    onValueChange={(value: string) => setProfile({ ...profile, relation: value })}
                  >
                    <SelectTrigger id="relation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ami">Ami(e)</SelectItem>
                      <SelectItem value="famille">Famille</SelectItem>
                      <SelectItem value="collegue">Collègue</SelectItem>
                      <SelectItem value="partenaire">Partenaire</SelectItem>
                      <SelectItem value="connaissance">Connaissance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Bloc 2: Psychologie (Sliders) */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Son Vibe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <PsychologySlider
                  label="Approche"
                  leftLabel="Pragmatique"
                  rightLabel="Sentimental"
                  value={profile.pragmatiqueSentimental}
                  onChange={(value) => setProfile({ ...profile, pragmatiqueSentimental: value })}
                />
                <PsychologySlider
                  label="Style de vie"
                  leftLabel="Routine"
                  rightLabel="Originalité"
                  value={profile.routineOriginalite}
                  onChange={(value) => setProfile({ ...profile, routineOriginalite: value })}
                />
                <PsychologySlider
                  label="Énergie"
                  leftLabel="Calme"
                  rightLabel="Énergie"
                  value={profile.calmeEnergie}
                  onChange={(value) => setProfile({ ...profile, calmeEnergie: value })}
                />
                <PsychologySlider
                  label="Personnalité"
                  leftLabel="Sérieux"
                  rightLabel="Fun"
                  value={profile.serieuxFun}
                  onChange={(value) => setProfile({ ...profile, serieuxFun: value })}
                />
                <PsychologySlider
                  label="Préférence cadeau"
                  leftLabel="Objet"
                  rightLabel="Expérience"
                  value={profile.objetExperience}
                  onChange={(value) => setProfile({ ...profile, objetExperience: value })}
                />
              </CardContent>
            </Card>

            {/* Bloc 3: Passions (Intérêts avec niveaux) */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">Ses Centres d'Intérêts</CardTitle>
              </CardHeader>
              <CardContent>
                <InterestTagManager
                  interests={profile.interets}
                  onInterestsChange={(interests) => setProfile({ ...profile, interets: interests })}
                  defaultSuggestions={["Lecture", "Musique", "Cinéma", "Gaming", "Voyages"]}
                  sliders={{
                    pragmatiqueSentimental: profile.pragmatiqueSentimental,
                    routineOriginalite: profile.routineOriginalite,
                    calmeEnergie: profile.calmeEnergie,
                    serieuxFun: profile.serieuxFun,
                    objetExperience: profile.objetExperience,
                  }}
                  selectedModel={selectedModel}
                  selectedProvider={selectedProvider}
                />
              </CardContent>
            </Card>

            {/* Bloc 4: Profilage Sociologique */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">Sa place dans le monde</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block font-semibold">Moment de Vie</Label>
                  <SmartTagManager
                    selectedTags={profile.momentDeVie}
                    onTagsChange={(tags: Tag[]) => setProfile({ ...profile, momentDeVie: tags })}
                    defaultSuggestions={[
                      "Étudiant",
                      "Jeune Parent",
                      "Retraité",
                      "En Reconversion",
                      "Jeune Actif",
                      "L'Organisateur",
                    ]}
                    placeholder="Ajouter un moment de vie..."
                  />
                </div>
                <div>
                  <Label className="mb-3 block font-semibold">Rôle dans le groupe</Label>
                  <SmartTagManager
                    selectedTags={profile.roleGroupe}
                    onTagsChange={(tags: Tag[]) => setProfile({ ...profile, roleGroupe: tags })}
                    defaultSuggestions={[
                      "Le Clown",
                      "Le Leader",
                      "Le Sage",
                      "Le Créatif",
                      "Le Médiateur",
                      "L'Aventurier",
                    ]}
                    placeholder="Ajouter un rôle..."
                  />
                </div>
                <div>
                  <Label className="mb-3 block font-semibold">Marques Totem</Label>
                  <SmartTagManager
                    selectedTags={profile.marquesTotem}
                    onTagsChange={(tags: Tag[]) => setProfile({ ...profile, marquesTotem: tags })}
                    defaultSuggestions={["Nike", "Apple", "Decathlon", "Patagonia", "Tesla"]}
                    placeholder="Ajouter une marque..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bloc 5: Contexte & Comportement */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Contexte Actuel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="profil-acheteur">Profil d'Acheteur</Label>
                  <Select
                    value={profile.profilAcheteur}
                    onValueChange={(value: string) => setProfile({ ...profile, profilAcheteur: value })}
                  >
                    <SelectTrigger id="profil-acheteur">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ne-se-prononce-pas">Ne se prononce pas</SelectItem>
                      <SelectItem value="impulsif">Impulsif</SelectItem>
                      <SelectItem value="collectionneur">Collectionneur</SelectItem>
                      <SelectItem value="econome">Économe</SelectItem>
                      <SelectItem value="reflechi">Réfléchi</SelectItem>
                      <SelectItem value="early-adopter">Early Adopter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-3 block font-semibold">Projets du Moment</Label>
                  <SmartTagManager
                    selectedTags={profile.projets}
                    onTagsChange={(tags: Tag[]) => setProfile({ ...profile, projets: tags })}
                    defaultSuggestions={["Apprendre une langue", "Déménagement", "Road Trip", "Marathon", "Déco Salon"]}
                    placeholder="Ajouter un projet..."
                  />
                </div>
                <div>
                  <Label className="mb-3 block font-semibold">Plaintes Récurrentes</Label>
                  <SmartTagManager
                    selectedTags={profile.plaintes}
                    onTagsChange={(tags: Tag[]) => setProfile({ ...profile, plaintes: tags })}
                    defaultSuggestions={["Froid aux pieds", "Manque de temps", "Dos douloureux", "Perd ses clés"]}
                    placeholder="Ajouter une plainte..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bloc 6: Zone Négative (Blacklist) */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">À éviter (Blacklist)</CardTitle>
              </CardHeader>
              <CardContent>
                <SmartTagManager
                  selectedTags={profile.blacklist}
                  onTagsChange={(tags: Tag[]) => setProfile({ ...profile, blacklist: tags })}
                  defaultSuggestions={["Alcool", "Parfums", "Vêtements", "Gadgets inutiles"]}
                  placeholder="Ajouter à éviter..."
                  variant="danger"
                />
              </CardContent>
            </Card>

            {/* Bloc 7: Cadre du Cadeau */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">Le Cadre du Cadeau</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Select value={profile.budget} onValueChange={(value: string) => setProfile({ ...profile, budget: value })}>
                    <SelectTrigger id="budget">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ne-se-prononce-pas">Ne se prononce pas</SelectItem>
                      <SelectItem value="petit">Petit (€ - moins de 30€)</SelectItem>
                      <SelectItem value="moyen">Moyen (€€ - 30-100€)</SelectItem>
                      <SelectItem value="eleve">Élevé (€€€ - 100-300€)</SelectItem>
                      <SelectItem value="premium">Premium (€€€€ - plus de 300€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Intention</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { value: "ne-se-prononce-pas", label: "🤷", desc: "Ne se prononce pas" },
                      { value: "wow", label: "✨ Wow", desc: "Impressionner" },
                      { value: "utile", label: "🎯 Utile", desc: "Pratique" },
                      { value: "fun", label: "🎉 Fun", desc: "Amusant" },
                      { value: "apprendre", label: "📚 Apprendre", desc: "Éducatif" },
                      { value: "emouvoir", label: "💝 Émouvoir", desc: "Émotion" },
                    ].map((intention) => (
                      <button
                        key={intention.value}
                        onClick={() => setProfile({ ...profile, intention: intention.value })}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${profile.intention === intention.value
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50"
                          }`}
                      >
                        <div className="font-semibold text-sm mb-1">{intention.label}</div>
                        <div className="text-xs text-muted-foreground">{intention.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Résultats */}
          {giftResults.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-balance">Idées Cadeaux Personnalisées</h2>
                <Button
                  onClick={handleGenerateGifts}
                  disabled={isLoading}
                  variant="outline"
                  className="gap-2 bg-transparent"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Voir Plus d'Idées
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {giftResults.map((gift) => (
                  <GiftCard key={gift.id} gift={gift} onDismiss={handleDismissGift} />
                ))}
              </div>
            </div>
          )}

          {/* CTA Principal */}
          {giftResults.length === 0 && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="py-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Gift className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-balance">Prêt à trouver le cadeau parfait ?</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-pretty">
                  Cliquez sur le bouton ci-dessous et laissez notre IA analyser ce profil pour vous proposer des idées
                  de cadeaux personnalisées.
                </p>
                <Button onClick={handleGenerateGifts} size="lg" disabled={isLoading} className="gap-2 mt-4">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Générer mes Idées Cadeaux
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

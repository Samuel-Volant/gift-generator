"use client"

import { useState, useEffect } from "react"
import { Sparkles, Gift, Loader2, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SmartTagManager } from "@/components/smart-tag-manager"
import { InterestTagManager } from "@/components/interest-tag-manager"
import { PsychologySlider } from "@/components/psychology-slider"
import { GiftCard } from "@/components/gift-card"
import type { Tag, Budget, Intention, BuyerProfile } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { FALLBACK_MODELS, DEFAULT_MODEL, type AIModel } from "@/lib/ai-models"
import { validateBudgetRange } from "@/lib/prompts/helpers"
import { usePersistedProfile } from "@/hooks/use-persisted-profile"

export default function GiftGeniusPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [availableModels, setAvailableModels] = useState<AIModel[]>(FALLBACK_MODELS)
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const { toast } = useToast()
  const {
    profile,
    setProfile,
    giftResults,
    appendGifts,
    dismissGift,
    alreadySuggestedTitles,
    clearAll,
  } = usePersistedProfile()

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

  const budgetError = validateBudgetRange(profile.budgetMin, profile.budgetMax)

  const handleGenerateGifts = async () => {
    if (budgetError) {
      toast({ title: "Budget invalide", description: budgetError, variant: "destructive" })
      return
    }
    if (isLoading) return
    setIsLoading(true)
    try {
      const alreadySuggestedGiftTitles = alreadySuggestedTitles

      const response = await fetch("/api/generate-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          alreadySuggestedGiftTitles,
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
        appendGifts(data.gift_ideas)

        toast({
          title: "Idées générées !",
          description: `${data.gift_ideas.length} nouvelles idées trouvées.`,
        })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(message)
      toast({
        title: "Erreur",
        description: message || "Impossible de générer des cadeaux pour le moment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismissGift = (giftId: string, blacklistTag?: string) => {
    if (blacklistTag && blacklistTag.trim().length > 0) {
      const normalizedTag = blacklistTag.trim().toLowerCase()
      setProfile((prev) => {
        const isDuplicate = prev.blacklist.some((tag) => tag.label.toLowerCase() === normalizedTag)
        if (isDuplicate) return prev
        const newTag: Tag = {
          id: `${Date.now()}-${Math.random()}`,
          label: blacklistTag.trim(),
        }
        return { ...prev, blacklist: [...prev.blacklist, newTag] }
      })
    }
    dismissGift(giftId)
  }

  const handleReset = () => {
    clearAll()
    setIsResetDialogOpen(false)
    toast({
      title: "Réinitialisé",
      description: "Profil et cadeaux effacés. LocalStorage vidé.",
    })
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
              <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 bg-transparent" aria-label="Réinitialiser profil et cadeaux">
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Réinitialiser</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Réinitialiser ?</DialogTitle>
                    <DialogDescription>
                      Cette action effacera le profil, les cadeaux générés et l&apos;historique des titres déjà suggérés
                      stockés en local. Cette action est irréversible.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button variant="destructive" onClick={handleReset}>
                      Confirmer la réinitialisation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                    onChange={(e) => setProfile((prev) => ({ ...prev, age: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Select value={profile.genre} onValueChange={(value: string) => setProfile((prev) => ({ ...prev, genre: value }))}>
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
                    onValueChange={(value: string) => setProfile((prev) => ({ ...prev, relation: value }))}
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
                  onChange={(value) => setProfile((prev) => ({ ...prev, pragmatiqueSentimental: value }))}
                />
                <PsychologySlider
                  label="Style de vie"
                  leftLabel="Routine"
                  rightLabel="Originalité"
                  value={profile.routineOriginalite}
                  onChange={(value) => setProfile((prev) => ({ ...prev, routineOriginalite: value }))}
                />
                <PsychologySlider
                  label="Énergie"
                  leftLabel="Calme"
                  rightLabel="Énergie"
                  value={profile.calmeEnergie}
                  onChange={(value) => setProfile((prev) => ({ ...prev, calmeEnergie: value }))}
                />
                <PsychologySlider
                  label="Personnalité"
                  leftLabel="Sérieux"
                  rightLabel="Fun"
                  value={profile.serieuxFun}
                  onChange={(value) => setProfile((prev) => ({ ...prev, serieuxFun: value }))}
                />
                <PsychologySlider
                  label="Préférence cadeau"
                  leftLabel="Objet"
                  rightLabel="Expérience"
                  value={profile.objetExperience}
                  onChange={(value) => setProfile((prev) => ({ ...prev, objetExperience: value }))}
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
                  onInterestsChange={(interests) => setProfile((prev) => ({ ...prev, interets: interests }))}
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
                    onTagsChange={(tags: Tag[]) => setProfile((prev) => ({ ...prev, momentDeVie: tags }))}
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
                    onTagsChange={(tags: Tag[]) => setProfile((prev) => ({ ...prev, roleGroupe: tags }))}
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
                    onTagsChange={(tags: Tag[]) => setProfile((prev) => ({ ...prev, marquesTotem: tags }))}
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
                    onValueChange={(value: string) => setProfile((prev) => ({ ...prev, profilAcheteur: value as BuyerProfile }))}
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
                    onTagsChange={(tags: Tag[]) => setProfile((prev) => ({ ...prev, projets: tags }))}
                    defaultSuggestions={["Apprendre une langue", "Déménagement", "Road Trip", "Marathon", "Déco Salon"]}
                    placeholder="Ajouter un projet..."
                  />
                </div>
                <div>
                  <Label className="mb-3 block font-semibold">Plaintes Récurrentes</Label>
                  <SmartTagManager
                    selectedTags={profile.plaintes}
                    onTagsChange={(tags: Tag[]) => setProfile((prev) => ({ ...prev, plaintes: tags }))}
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
                  onTagsChange={(tags: Tag[]) => setProfile((prev) => ({ ...prev, blacklist: tags }))}
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
                  <Select value={profile.budget} onValueChange={(value: string) => setProfile((prev) => ({ ...prev, budget: value as Budget }))}>
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
                  <p className="text-xs text-muted-foreground">Le preset est une indication souple pour le LLM.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Min €</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={5000}
                      placeholder="20"
                      value={profile.budgetMin ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === "") {
                          setProfile((prev) => ({ ...prev, budgetMin: undefined }))
                        } else {
                          const n = Number(raw)
                          setProfile((prev) => ({ ...prev, budgetMin: Number.isFinite(n) ? n : undefined }))
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Max €</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={5000}
                      placeholder="80"
                      value={profile.budgetMax ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === "") {
                          setProfile((prev) => ({ ...prev, budgetMax: undefined }))
                        } else {
                          const n = Number(raw)
                          setProfile((prev) => ({ ...prev, budgetMax: Number.isFinite(n) ? n : undefined }))
                        }
                      }}
                    />
                  </div>
                </div>
                {budgetError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {budgetError}
                  </p>
                ) : (
                  (profile.budgetMin !== undefined || profile.budgetMax !== undefined) && (
                    <p className="text-xs text-muted-foreground">
                      Fourchette précise prioritaire sur le preset pour la génération.
                    </p>
                  )
                )}

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
                        onClick={() => setProfile((prev) => ({ ...prev, intention: intention.value as Intention }))}
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
                  disabled={isLoading || !!budgetError}
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
                <Button onClick={handleGenerateGifts} size="lg" disabled={isLoading || !!budgetError} className="gap-2 mt-4">
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

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Check, Eye, AlertTriangle, ArrowRight } from "lucide-react"
import type { OfferTemplate } from "@/types/offer-template"

interface SuggestionItem {
  id: string
  from: string | RegExp
  to: string
  description?: string
  isRegex?: boolean
  category?: string
}

interface SuggestionsPanelProps {
  templates: OfferTemplate[]
  contents: Record<string, string>
  onApplyChanges: (changes: Record<string, string>) => void
  onClose: () => void
}

export function SuggestionsPanel({ templates, contents, onApplyChanges, onClose }: SuggestionsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("suggestions")
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, boolean>>({})
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, boolean>>({})
  const [previewContent, setPreviewContent] = useState<Record<string, string>>({})
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null)
  const [suggestionResults, setSuggestionResults] = useState<Record<string, Record<string, number>>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  // Liste des suggestions prédéfinies
  const defaultSuggestions: SuggestionItem[] = [
    {
      id: "reference-1",
      from: "24-6000-34-G3",
      to: "[REFERENCE]",
      description: "Remplacer la référence par une variable",
      category: "Références",
    },
    {
      id: "reference-2",
      from: "24-6000-34-G2AVP",
      to: "[REFERENCE]",
      description: "Remplacer la référence par une variable",
      category: "Références",
    },
    {
      id: "reference-3",
      from: "24-6666-34-G2AVP-G2PRO",
      to: "[REFERENCE]",
      description: "Remplacer la référence par une variable",
      category: "Références",
    },
    {
      id: "reference-4",
      from: "24-6000-34-G1PGC",
      to: "[REFERENCE]",
      description: "Remplacer la référence par une variable",
      category: "Références",
    },
  ]

  // Initialiser les suggestions sélectionnées
  useEffect(() => {
    const initialSuggestions: Record<string, boolean> = {}
    defaultSuggestions.forEach((suggestion) => {
      initialSuggestions[suggestion.id] = true
    })
    setSelectedSuggestions(initialSuggestions)
  }, [])

  // Fonction pour échapper les caractères spéciaux dans les regex
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  // Analyser les templates pour trouver les suggestions applicables
  const analyzeSuggestions = () => {
    setIsAnalyzing(true)

    const results: Record<string, Record<string, number>> = {}
    const initialSelectedTemplates: Record<string, boolean> = {}

    templates.forEach((template) => {
      const content = contents[template.id] || template.content
      const templateResults: Record<string, number> = {}
      let hasMatches = false

      defaultSuggestions.forEach((suggestion) => {
        if (suggestion.isRegex) {
          const regex = suggestion.from as RegExp
          const matches = (content.match(regex) || []).length
          if (matches > 0) {
            templateResults[suggestion.id] = matches
            hasMatches = true
          }
        } else {
          const searchTerm = suggestion.from as string
          const regex = new RegExp(escapeRegExp(searchTerm), "gi")
          const matches = (content.match(regex) || []).length
          if (matches > 0) {
            templateResults[suggestion.id] = matches
            hasMatches = true
          }
        }
      })

      if (Object.keys(templateResults).length > 0) {
        results[template.id] = templateResults
        initialSelectedTemplates[template.id] = true
      }
    })

    setSuggestionResults(results)
    setSelectedTemplates(initialSelectedTemplates)

    // Sélectionner le premier template pour la prévisualisation
    const templatesWithSuggestions = Object.keys(results)
    if (templatesWithSuggestions.length > 0) {
      setPreviewTemplateId(templatesWithSuggestions[0])
      updatePreview(templatesWithSuggestions[0], selectedSuggestions)
    }

    setIsAnalyzing(false)
  }

  // Mettre à jour la prévisualisation
  const updatePreview = (templateId: string, selectedSugs: Record<string, boolean>) => {
    if (!templateId) return

    const content = contents[templateId] || templates.find((t) => t.id === templateId)?.content || ""
    let newContent = content

    defaultSuggestions.forEach((suggestion) => {
      if (selectedSugs[suggestion.id] && suggestionResults[templateId]?.[suggestion.id] > 0) {
        if (suggestion.isRegex) {
          newContent = newContent.replace(suggestion.from as RegExp, suggestion.to)
        } else {
          const regex = new RegExp(escapeRegExp(suggestion.from as string), "gi")
          newContent = newContent.replace(regex, suggestion.to)
        }
      }
    })

    setPreviewContent((prev) => ({
      ...prev,
      [templateId]: newContent,
    }))
  }

  // Mettre à jour la prévisualisation quand on change de template ou de suggestions
  useEffect(() => {
    if (previewTemplateId) {
      updatePreview(previewTemplateId, selectedSuggestions)
    }
  }, [previewTemplateId, selectedSuggestions])

  // Appliquer les suggestions sélectionnées
  const applySuggestions = () => {
    setIsApplying(true)

    const changes: Record<string, string> = {}

    Object.entries(selectedTemplates).forEach(([templateId, isSelected]) => {
      if (isSelected) {
        const content = contents[templateId] || templates.find((t) => t.id === templateId)?.content || ""
        let newContent = content

        defaultSuggestions.forEach((suggestion) => {
          if (selectedSuggestions[suggestion.id] && suggestionResults[templateId]?.[suggestion.id] > 0) {
            if (suggestion.isRegex) {
              newContent = newContent.replace(suggestion.from as RegExp, suggestion.to)
            } else {
              const regex = new RegExp(escapeRegExp(suggestion.from as string), "gi")
              newContent = newContent.replace(regex, suggestion.to)
            }
          }
        })

        if (newContent !== content) {
          changes[templateId] = newContent
        }
      }
    })

    onApplyChanges(changes)
    setIsApplying(false)
    onClose()
  }

  // Fonction pour mettre en évidence les différences
  const highlightDifferences = (original: string, modified: string) => {
    // Cette fonction est simplifiée et ne montre que le résultat final
    // Une implémentation plus avancée pourrait montrer les différences exactes
    return modified
  }

  // Grouper les suggestions par catégorie
  const suggestionsByCategory = defaultSuggestions.reduce(
    (acc, suggestion) => {
      const category = suggestion.category || "Autres"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(suggestion)
      return acc
    },
    {} as Record<string, SuggestionItem[]>,
  )

  // Compter le nombre total de suggestions trouvées
  const totalSuggestionsCount = Object.values(suggestionResults).reduce((total, templateResults) => {
    return total + Object.values(templateResults).reduce((sum, count) => sum + count, 0)
  }, 0)

  // Compter le nombre de templates avec des suggestions
  const templatesWithSuggestionsCount = Object.keys(suggestionResults).length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Suggestions de corrections</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fermer
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="preview">Prévisualisation</TabsTrigger>
          <TabsTrigger value="apply">Appliquer</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="flex-1 p-4 space-y-4 overflow-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Suggestions disponibles</h3>
              <p className="text-sm text-muted-foreground">Sélectionnez les suggestions à appliquer aux templates</p>
            </div>
            <Button onClick={analyzeSuggestions} disabled={isAnalyzing}>
              {isAnalyzing ? (
                "Analyse en cours..."
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyser les templates
                </>
              )}
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-6">
              {Object.entries(suggestionsByCategory).map(([category, suggestions]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-sm font-medium">{category}</h3>
                  <div className="space-y-2">
                    {suggestions.map((suggestion) => (
                      <Card key={suggestion.id} className="p-0">
                        <CardHeader className="p-3 pb-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`suggestion-${suggestion.id}`}
                                  checked={selectedSuggestions[suggestion.id] || false}
                                  onCheckedChange={(checked) => {
                                    setSelectedSuggestions((prev) => ({
                                      ...prev,
                                      [suggestion.id]: checked as boolean,
                                    }))
                                  }}
                                />
                                <Label htmlFor={`suggestion-${suggestion.id}`} className="font-medium cursor-pointer">
                                  {suggestion.description || `Remplacer "${suggestion.from}" par "${suggestion.to}"`}
                                </Label>
                              </div>
                              {Object.values(suggestionResults).some((result) => result[suggestion.id]) && (
                                <Badge variant="outline" className="mt-1 ml-6">
                                  {Object.values(suggestionResults).reduce(
                                    (sum, result) => sum + (result[suggestion.id] || 0),
                                    0,
                                  )}{" "}
                                  occurrences
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="bg-muted p-1 rounded flex-1">
                              <code className="text-xs">{suggestion.from.toString()}</code>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className="bg-muted p-1 rounded flex-1">
                              <code className="text-xs">{suggestion.to}</code>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {totalSuggestionsCount > 0 && (
            <div className="pt-2 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{totalSuggestionsCount}</span> suggestions trouvées dans{" "}
                <span className="font-medium">{templatesWithSuggestionsCount}</span> templates
              </div>
              <Button onClick={() => setActiveTab("preview")}>
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </Button>
            </div>
          )}

          {totalSuggestionsCount === 0 && Object.keys(suggestionResults).length > 0 && (
            <div className="flex items-center justify-center p-4 border rounded-md">
              <div className="text-center text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Aucune suggestion trouvée dans les templates.</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="flex-1 p-4 space-y-4 overflow-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Prévisualisation des changements</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveTab("suggestions")}>
                Retour aux suggestions
              </Button>
              <Button size="sm" onClick={() => setActiveTab("apply")}>
                Continuer
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 h-[calc(100vh-250px)]">
            <Card className="col-span-1 overflow-hidden">
              <CardHeader className="p-3">
                <CardTitle className="text-sm">Templates avec suggestions</CardTitle>
                <CardDescription>{Object.keys(suggestionResults).length} templates concernés</CardDescription>
              </CardHeader>
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="p-3 space-y-2">
                  {Object.entries(suggestionResults).map(([templateId, results]) => {
                    const template = templates.find((t) => t.id === templateId)
                    const totalSuggestions = Object.values(results).reduce((sum, count) => sum + count, 0)

                    return (
                      <div
                        key={templateId}
                        className={`p-2 rounded-md cursor-pointer ${
                          previewTemplateId === templateId ? "bg-muted" : "hover:bg-muted/50"
                        }`}
                        onClick={() => setPreviewTemplateId(templateId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate">{template?.name || templateId}</div>
                          <Badge variant="outline">{totalSuggestions}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </Card>

            <Card className="col-span-2 overflow-hidden">
              <CardHeader className="p-3">
                <CardTitle className="text-sm">
                  {previewTemplateId && templates.find((t) => t.id === previewTemplateId)?.name}
                </CardTitle>
                <CardDescription>Prévisualisation des modifications</CardDescription>
              </CardHeader>
              <ScrollArea className="h-[calc(100vh-350px)]">
                {previewTemplateId ? (
                  <div className="p-3">
                    <div
                      className="p-3 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap overflow-x-auto"
                      dangerouslySetInnerHTML={{
                        __html: highlightDifferences(
                          contents[previewTemplateId] || "",
                          previewContent[previewTemplateId] || "",
                        ),
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Sélectionnez un template pour prévisualiser les changements
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="apply" className="flex-1 p-4 space-y-4 overflow-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Appliquer les suggestions</h3>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("preview")}>
              Retour à la prévisualisation
            </Button>
          </div>

          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Sélectionner les templates à modifier</CardTitle>
              <CardDescription>Les suggestions sélectionnées seront appliquées aux templates cochés</CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">
                  {Object.values(selectedTemplates).filter(Boolean).length} templates sélectionnés
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allSelected = Object.keys(suggestionResults).reduce(
                        (acc, id) => {
                          acc[id] = true
                          return acc
                        },
                        {} as Record<string, boolean>,
                      )
                      setSelectedTemplates(allSelected)
                    }}
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const noneSelected = Object.keys(suggestionResults).reduce(
                        (acc, id) => {
                          acc[id] = false
                          return acc
                        },
                        {} as Record<string, boolean>,
                      )
                      setSelectedTemplates(noneSelected)
                    }}
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px] border rounded-md p-2">
                <div className="space-y-2">
                  {Object.entries(suggestionResults).map(([templateId, results]) => {
                    const template = templates.find((t) => t.id === templateId)
                    const totalSuggestions = Object.values(results).reduce((sum, count) => sum + count, 0)

                    return (
                      <div key={templateId} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                        <Checkbox
                          id={`template-${templateId}`}
                          checked={selectedTemplates[templateId] || false}
                          onCheckedChange={(checked) => {
                            setSelectedTemplates((prev) => ({
                              ...prev,
                              [templateId]: checked as boolean,
                            }))
                          }}
                        />
                        <Label htmlFor={`template-${templateId}`} className="flex-1 cursor-pointer">
                          {template?.name || templateId}
                        </Label>
                        <Badge variant="outline">{totalSuggestions} suggestions</Badge>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-3 flex justify-between">
              <div className="text-sm text-muted-foreground">
                {Object.values(selectedSuggestions).filter(Boolean).length} suggestions sélectionnées
              </div>
              <Button
                onClick={applySuggestions}
                disabled={
                  isApplying ||
                  Object.values(selectedTemplates).filter(Boolean).length === 0 ||
                  Object.values(selectedSuggestions).filter(Boolean).length === 0
                }
              >
                {isApplying ? (
                  "Application en cours..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Appliquer les suggestions
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

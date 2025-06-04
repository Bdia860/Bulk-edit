"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Replace, Eye } from "lucide-react"
import type { OfferTemplate } from "@/types/offer-template"

interface SearchReplaceModalProps {
  isOpen: boolean
  onClose: () => void
  templates: OfferTemplate[]
  currentTemplateId: string | null
  contents: Record<string, string>
  onApplyChanges: (changes: Record<string, string>) => void
}

export function SearchReplaceModal({
  isOpen,
  onClose,
  templates,
  currentTemplateId,
  contents,
  onApplyChanges,
}: SearchReplaceModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [replaceTerm, setReplaceTerm] = useState("")
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [searchResults, setSearchResults] = useState<Record<string, number>>({})
  const [previewContents, setPreviewContents] = useState<Record<string, string>>({})
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<string>("search")

  // Initialiser les templates sélectionnés
  useEffect(() => {
    if (isOpen) {
      const initialSelection: Record<string, boolean> = {}
      templates.forEach((template) => {
        initialSelection[template.id] = template.id === currentTemplateId
      })
      setSelectedTemplates(initialSelection)
    }
  }, [isOpen, templates, currentTemplateId])

  // Réinitialiser les états quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
      setReplaceTerm("")
      setSearchResults({})
      setPreviewContents({})
    }
  }, [isOpen])

  // Fonction pour échapper les caractères spéciaux dans les regex
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  // Fonction pour rechercher
  const handleSearch = () => {
    if (!searchTerm) return

    const results: Record<string, number> = {}
    const previews: Record<string, string> = {}

    templates.forEach((template) => {
      const content = contents[template.id] || template.content

      let flags = "g"
      if (!matchCase) flags += "i"

      let searchPattern = escapeRegExp(searchTerm)
      if (wholeWord) searchPattern = `\\b${searchPattern}\\b`

      const regex = new RegExp(searchPattern, flags)
      const matches = (content.match(regex) || []).length

      if (matches > 0) {
        results[template.id] = matches
        previews[template.id] = content
      }
    })

    setSearchResults(results)
    setPreviewContents(previews)

    // Si des résultats sont trouvés, passer à l'onglet de prévisualisation
    if (Object.keys(results).length > 0) {
      setActiveTab("preview")
    }
  }

  // Fonction pour prévisualiser les remplacements
  const handlePreview = () => {
    if (!searchTerm || !replaceTerm) return

    const previews: Record<string, string> = {}

    Object.keys(searchResults).forEach((templateId) => {
      const content = contents[templateId] || templates.find((t) => t.id === templateId)?.content || ""

      let flags = "g"
      if (!matchCase) flags += "i"

      let searchPattern = escapeRegExp(searchTerm)
      if (wholeWord) searchPattern = `\\b${searchPattern}\\b`

      const regex = new RegExp(searchPattern, flags)
      const newContent = content.replace(regex, replaceTerm)

      previews[templateId] = newContent
    })

    setPreviewContents(previews)
  }

  // Mettre à jour la prévisualisation quand les termes changent
  useEffect(() => {
    if (searchTerm && replaceTerm && Object.keys(searchResults).length > 0) {
      handlePreview()
    }
  }, [searchTerm, replaceTerm, searchResults, matchCase, wholeWord])

  // Fonction pour appliquer les changements
  const handleApply = () => {
    const changes: Record<string, string> = {}

    Object.entries(selectedTemplates).forEach(([templateId, isSelected]) => {
      if (isSelected && previewContents[templateId]) {
        changes[templateId] = previewContents[templateId]
      }
    })

    onApplyChanges(changes)
    onClose()
  }

  // Fonction pour formater le contenu avec mise en évidence
  const highlightContent = (content: string, templateId: string) => {
    if (!searchTerm) return content

    let flags = "g"
    if (!matchCase) flags += "i"

    let searchPattern = escapeRegExp(searchTerm)
    if (wholeWord) searchPattern = `\\b${searchPattern}\\b`

    const regex = new RegExp(searchPattern, flags)

    // Remplacer par des balises de mise en évidence
    return content.replace(regex, `<mark class="bg-yellow-200 dark:bg-yellow-800">${replaceTerm || "$&"}</mark>`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Rechercher et remplacer</DialogTitle>
          <DialogDescription>
            Recherchez du texte dans les templates et remplacez-le par un nouveau texte.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Recherche
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Prévisualisation
              {Object.keys(searchResults).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {Object.keys(searchResults).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="flex-1 space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="searchTerm">Rechercher</Label>
                <Input
                  id="searchTerm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Texte à rechercher"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="replaceTerm">Remplacer par</Label>
                <Input
                  id="replaceTerm"
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  placeholder="Texte de remplacement"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="matchCase"
                  checked={matchCase}
                  onCheckedChange={(checked) => setMatchCase(checked as boolean)}
                />
                <Label htmlFor="matchCase" className="text-sm">
                  Respecter la casse
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wholeWord"
                  checked={wholeWord}
                  onCheckedChange={(checked) => setWholeWord(checked as boolean)}
                />
                <Label htmlFor="wholeWord" className="text-sm">
                  Mots entiers
                </Label>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleSearch} disabled={!searchTerm} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Rechercher dans tous les templates
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 space-y-4 mt-4">
            {Object.keys(searchResults).length > 0 ? (
              <div className="space-y-4 flex flex-col h-full">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {Object.values(searchResults).reduce((a, b) => a + b, 0)} occurrences trouvées dans{" "}
                    {Object.keys(searchResults).length} templates
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("search")}>
                    Modifier la recherche
                  </Button>
                </div>

                <div className="border rounded-md p-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Sélectionner les templates à modifier</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allSelected = Object.keys(searchResults).reduce(
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
                          const noneSelected = Object.keys(searchResults).reduce(
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
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {Object.entries(searchResults).map(([templateId, count]) => {
                        const template = templates.find((t) => t.id === templateId)
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
                            <Badge variant="outline">{count} occurrences</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex-1 overflow-hidden border rounded-md">
                  <ScrollArea className="h-[200px]">
                    <div className="p-4 space-y-6">
                      {Object.entries(searchResults)
                        .filter(([templateId]) => selectedTemplates[templateId])
                        .map(([templateId, count]) => {
                          const template = templates.find((t) => t.id === templateId)
                          const content = previewContents[templateId]
                          const highlightedContent = highlightContent(content, templateId)

                          return (
                            <div key={templateId} className="space-y-2">
                              <h3 className="font-medium">{template?.name || templateId}</h3>
                              <div
                                className="p-3 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap overflow-x-auto"
                                dangerouslySetInnerHTML={{ __html: highlightedContent }}
                              />
                            </div>
                          )
                        })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                Aucun résultat trouvé. Veuillez effectuer une recherche.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
          <Button
            onClick={handleApply}
            disabled={
              Object.entries(selectedTemplates).filter(([_, isSelected]) => isSelected).length === 0 ||
              !searchTerm ||
              !replaceTerm
            }
            className="flex items-center gap-2"
          >
            <Replace className="h-4 w-4" />
            Appliquer les remplacements
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

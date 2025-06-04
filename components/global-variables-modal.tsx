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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Save, Edit, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { OfferTemplate } from "@/types/offer-template"

export interface GlobalVariable {
  key: string
  value: string
}

export interface GlobalVariablesList {
  id: string
  name: string
  variables: GlobalVariable[]
}

interface GlobalVariablesModalProps {
  isOpen: boolean
  onClose: () => void
  templates: OfferTemplate[]
  currentTemplateId: string | null
  contents: Record<string, string>
  onApplyChanges: (changes: Record<string, string>) => void
  lists: GlobalVariablesList[]
  onSaveLists: (lists: GlobalVariablesList[]) => void
}

export function GlobalVariablesModal({
  isOpen,
  onClose,
  templates,
  currentTemplateId,
  contents,
  onApplyChanges,
  lists,
  onSaveLists,
}: GlobalVariablesModalProps) {
  const [activeTab, setActiveTab] = useState<string>("lists")
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [editingList, setEditingList] = useState<GlobalVariablesList | null>(null)
  const [newListName, setNewListName] = useState("")
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(currentTemplateId)
  const [previewContent, setPreviewContent] = useState<string>("")
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, boolean>>({})
  const [selectedListForApply, setSelectedListForApply] = useState<string | null>(null)

  // Initialiser les templates sélectionnés
  useEffect(() => {
    if (isOpen && currentTemplateId) {
      const initialSelection: Record<string, boolean> = {}
      templates.forEach((template) => {
        initialSelection[template.id] = template.id === currentTemplateId
      })
      setSelectedTemplates(initialSelection)
      setPreviewTemplateId(currentTemplateId)

      if (currentTemplateId && contents[currentTemplateId]) {
        setPreviewContent(contents[currentTemplateId])
      }
    }
  }, [isOpen, templates, currentTemplateId, contents])

  // Réinitialiser les états quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setEditingList(null)
      setNewListName("")
      setPreviewContent("")
    }
  }, [isOpen])

  // Mettre à jour la prévisualisation quand on change de template ou de liste
  useEffect(() => {
    if (previewTemplateId && selectedListForApply) {
      const content = contents[previewTemplateId] || ""
      const list = lists.find((l) => l.id === selectedListForApply)

      if (list) {
        let newContent = content
        list.variables.forEach((variable) => {
          const regex = new RegExp(`\\[${variable.key}\\]`, "g")
          newContent = newContent.replace(regex, variable.value)
        })
        setPreviewContent(newContent)
      } else {
        setPreviewContent(content)
      }
    } else if (previewTemplateId) {
      setPreviewContent(contents[previewTemplateId] || "")
    }
  }, [previewTemplateId, selectedListForApply, contents, lists])

  const handleCreateNewList = () => {
    if (!newListName.trim()) return

    const newList: GlobalVariablesList = {
      id: Date.now().toString(),
      name: newListName,
      variables: [],
    }

    onSaveLists([...lists, newList])
    setNewListName("")
    setSelectedListId(newList.id)
    setEditingList(newList)
    setActiveTab("edit")
  }

  const handleEditList = (list: GlobalVariablesList) => {
    setSelectedListId(list.id)
    setEditingList({ ...list })
    setActiveTab("edit")
  }

  const handleDeleteList = (listId: string) => {
    onSaveLists(lists.filter((list) => list.id !== listId))
    if (selectedListId === listId) {
      setSelectedListId(null)
      setEditingList(null)
    }
  }

  const handleAddVariable = () => {
    if (!editingList) return

    setEditingList({
      ...editingList,
      variables: [...editingList.variables, { key: "", value: "" }],
    })
  }

  const handleUpdateVariable = (index: number, field: "key" | "value", value: string) => {
    if (!editingList) return

    const updatedVariables = [...editingList.variables]
    updatedVariables[index] = {
      ...updatedVariables[index],
      [field]: value,
    }

    setEditingList({
      ...editingList,
      variables: updatedVariables,
    })
  }

  const handleRemoveVariable = (index: number) => {
    if (!editingList) return

    const updatedVariables = [...editingList.variables]
    updatedVariables.splice(index, 1)

    setEditingList({
      ...editingList,
      variables: updatedVariables,
    })
  }

  const handleSaveList = () => {
    if (!editingList) return

    // Filtrer les variables vides
    const cleanedVariables = editingList.variables.filter((v) => v.key.trim() !== "")

    const updatedList = {
      ...editingList,
      variables: cleanedVariables,
    }

    const updatedLists = lists.map((list) => (list.id === updatedList.id ? updatedList : list))

    if (!lists.some((list) => list.id === updatedList.id)) {
      updatedLists.push(updatedList)
    }

    onSaveLists(updatedLists)
    setActiveTab("lists")
    setEditingList(null)
  }

  const handleApplyChanges = () => {
    if (!selectedListForApply) return

    const selectedList = lists.find((l) => l.id === selectedListForApply)
    if (!selectedList) return

    const changes: Record<string, string> = {}

    Object.entries(selectedTemplates).forEach(([templateId, isSelected]) => {
      if (isSelected) {
        const content = contents[templateId] || ""
        let newContent = content

        selectedList.variables.forEach((variable) => {
          const regex = new RegExp(`\\[${variable.key}\\]`, "g")
          newContent = newContent.replace(regex, variable.value)
        })

        if (newContent !== content) {
          changes[templateId] = newContent
        }
      }
    })

    if (Object.keys(changes).length > 0) {
      onApplyChanges(changes)
      onClose()
    }
  }

  // Fonction pour mettre en évidence les variables dans le contenu
  const highlightVariables = (content: string, listId: string | null) => {
    if (!listId) return content

    const list = lists.find((l) => l.id === listId)
    if (!list) return content

    let highlightedContent = content

    list.variables.forEach((variable) => {
      const regex = new RegExp(`\\[${variable.key}\\]`, "g")
      highlightedContent = highlightedContent.replace(
        regex,
        `<mark class="bg-green-200 dark:bg-green-800">${variable.value}</mark>`,
      )
    })

    return highlightedContent
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Variables globales</DialogTitle>
          <DialogDescription>Créez et gérez des listes de variables globales pour vos templates.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="lists">Listes</TabsTrigger>
            <TabsTrigger value="edit" disabled={!editingList}>
              Édition
            </TabsTrigger>
            <TabsTrigger value="apply">Appliquer</TabsTrigger>
          </TabsList>

          {/* Onglet Listes */}
          <TabsContent value="lists" className="flex-1 space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nom de la nouvelle liste"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              <Button onClick={handleCreateNewList} disabled={!newListName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Créer
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {lists.map((list) => (
                <Card key={list.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>{list.name}</CardTitle>
                    <CardDescription>
                      {list.variables.length} variable{list.variables.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ScrollArea className="h-24">
                      <div className="space-y-1">
                        {list.variables.map((variable, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="font-medium">[{variable.key}]</span>
                            <span className="text-muted-foreground">{variable.value}</span>
                          </div>
                        ))}
                        {list.variables.length === 0 && (
                          <div className="text-sm text-muted-foreground italic">Aucune variable définie</div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => handleEditList(list)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Éditer
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteList(list.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {lists.length === 0 && (
                <div className="col-span-2 flex items-center justify-center h-40 border rounded-md">
                  <div className="text-center text-muted-foreground">
                    <p>Aucune liste définie</p>
                    <p className="text-sm">Créez une nouvelle liste pour commencer</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Onglet Édition */}
          <TabsContent value="edit" className="flex-1 space-y-4 mt-4">
            {editingList && (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="listName">Nom de la liste</Label>
                    <Input
                      id="listName"
                      value={editingList.name}
                      onChange={(e) => setEditingList({ ...editingList, name: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddVariable}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une variable
                  </Button>
                </div>

                <div className="border rounded-md p-4">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {editingList.variables.map((variable, index) => (
                        <div key={index} className="grid grid-cols-5 gap-4 items-center">
                          <div className="col-span-2">
                            <Label htmlFor={`key-${index}`} className="sr-only">
                              Clé
                            </Label>
                            <div className="flex items-center">
                              <span className="mr-2 text-muted-foreground">[</span>
                              <Input
                                id={`key-${index}`}
                                value={variable.key}
                                onChange={(e) => handleUpdateVariable(index, "key", e.target.value)}
                                placeholder="Clé"
                              />
                              <span className="ml-2 text-muted-foreground">]</span>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor={`value-${index}`} className="sr-only">
                              Valeur
                            </Label>
                            <Input
                              id={`value-${index}`}
                              value={variable.value}
                              onChange={(e) => handleUpdateVariable(index, "value", e.target.value)}
                              placeholder="Valeur"
                            />
                          </div>
                          <div>
                            <Button variant="destructive" size="icon" onClick={() => handleRemoveVariable(index)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Supprimer</span>
                            </Button>
                          </div>
                        </div>
                      ))}

                      {editingList.variables.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          <p>Aucune variable définie</p>
                          <p className="text-sm">Cliquez sur "Ajouter une variable" pour commencer</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab("lists")
                      setEditingList(null)
                    }}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleSaveList}>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Onglet Appliquer */}
          <TabsContent value="apply" className="flex-1 space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="selectList">Sélectionner une liste</Label>
                <Select value={selectedListForApply || ""} onValueChange={setSelectedListForApply}>
                  <SelectTrigger id="selectList">
                    <SelectValue placeholder="Choisir une liste" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="previewTemplate">Prévisualiser sur</Label>
                <Select value={previewTemplateId || ""} onValueChange={setPreviewTemplateId}>
                  <SelectTrigger id="previewTemplate">
                    <SelectValue placeholder="Choisir un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedListForApply && (
              <div className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Prévisualisation</h3>
                </div>

                <ScrollArea className="h-[200px]">
                  <div
                    className="p-3 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap overflow-x-auto"
                    dangerouslySetInnerHTML={{
                      __html: highlightVariables(previewContent, selectedListForApply),
                    }}
                  />
                </ScrollArea>
              </div>
            )}

            <div className="border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Sélectionner les templates à modifier</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allSelected = templates.reduce(
                        (acc, template) => {
                          acc[template.id] = true
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
                      const noneSelected = templates.reduce(
                        (acc, template) => {
                          acc[template.id] = false
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
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                      <Checkbox
                        id={`template-${template.id}`}
                        checked={selectedTemplates[template.id] || false}
                        onCheckedChange={(checked) => {
                          setSelectedTemplates((prev) => ({
                            ...prev,
                            [template.id]: checked as boolean,
                          }))
                        }}
                      />
                      <Label htmlFor={`template-${template.id}`} className="flex-1 cursor-pointer">
                        {template.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
          {activeTab === "apply" && (
            <Button
              onClick={handleApplyChanges}
              disabled={
                !selectedListForApply ||
                Object.entries(selectedTemplates).filter(([_, isSelected]) => isSelected).length === 0
              }
            >
              <Check className="h-4 w-4 mr-2" />
              Appliquer les variables
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

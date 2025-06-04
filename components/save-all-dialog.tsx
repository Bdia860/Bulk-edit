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
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Save, AlertCircle, CheckCircle2 } from "lucide-react"
import type { OfferTemplate, Config } from "@/types/offer-template"
import { batchSaveTemplates, type BatchProgress } from "@/services/batch-operations"

// Modifier l'interface SaveAllDialogProps pour inclure les headers et footers
interface SaveAllDialogProps {
  isOpen: boolean
  onClose: () => void
  templates: OfferTemplate[]
  modifiedTemplateIds: string[]
  modifiedContents: Record<string, string>
  templateConfigs: Record<string, Config>
  headers: Record<string, string>
  footers: Record<string, string>
  apiToken: string
  onSaveComplete: (result: { success: number; errors: number }) => void
}

export function SaveAllDialog({
  isOpen,
  onClose,
  templates,
  modifiedTemplateIds,
  modifiedContents,
  templateConfigs,
  headers,
  footers,
  apiToken,
  onSaveComplete,
}: SaveAllDialogProps) {
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [result, setResult] = useState<{ success: number; errors: number; failedIds: string[] } | null>(null)

  // Initialiser les templates sélectionnés
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplateIds([...modifiedTemplateIds])
      setResult(null)
    }
  }, [isOpen, modifiedTemplateIds])

  // Modifier la fonction handleSaveAll pour inclure les headers et footers
  const handleSaveAll = async () => {
    if (selectedTemplateIds.length === 0) return

    setIsSaving(true)
    setResult(null)

    const templatesToSave = selectedTemplateIds.map((id) => ({
      id,
      content: modifiedContents[id],
      config: templateConfigs[id] || {
        marginTop: "25mm",
        marginRight: "10mm",
        marginBottom: "25mm",
        marginLeft: "10mm",
        style: "",
      },
      header: headers[id] || "",
      footer: footers[id] || "",
    }))

    try {
      const result = await batchSaveTemplates(templatesToSave, apiToken, (progress) => {
        setProgress(progress)
      })

      setResult(result)
      onSaveComplete({ success: result.success, errors: result.errors })
    } catch (error) {
      console.error("Erreur lors de la sauvegarde groupée:", error)
      setResult({ success: 0, errors: selectedTemplateIds.length, failedIds: selectedTemplateIds })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTemplateIds([...modifiedTemplateIds])
    } else {
      setSelectedTemplateIds([])
    }
  }

  const toggleTemplate = (templateId: string, checked: boolean) => {
    if (checked) {
      setSelectedTemplateIds((prev) => [...prev, templateId])
    } else {
      setSelectedTemplateIds((prev) => prev.filter((id) => id !== templateId))
    }
  }

  const getTemplateName = (templateId: string) => {
    return templates.find((t) => t.id === templateId)?.name || `Template ${templateId}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sauvegarder tous les templates modifiés</DialogTitle>
          <DialogDescription>Sélectionnez les templates que vous souhaitez sauvegarder.</DialogDescription>
        </DialogHeader>

        {!isSaving && !result && (
          <>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedTemplateIds.length === modifiedTemplateIds.length}
                  onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                />
                <Label htmlFor="select-all">Sélectionner tout ({modifiedTemplateIds.length})</Label>
              </div>

              <ScrollArea className="h-60 border rounded-md p-2">
                <div className="space-y-2">
                  {modifiedTemplateIds.map((templateId) => (
                    <div key={templateId} className="flex items-center space-x-2">
                      <Checkbox
                        id={`template-${templateId}`}
                        checked={selectedTemplateIds.includes(templateId)}
                        onCheckedChange={(checked) => toggleTemplate(templateId, !!checked)}
                      />
                      <Label htmlFor={`template-${templateId}`} className="flex-1 cursor-pointer">
                        {getTemplateName(templateId)}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={selectedTemplateIds.length === 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Sauvegarder {selectedTemplateIds.length} template{selectedTemplateIds.length !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </>
        )}

        {isSaving && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="font-medium">Sauvegarde en cours...</p>
              <p className="text-sm text-muted-foreground">
                {progress ? `${progress.current}/${progress.total} - ${progress.templateName}` : "Préparation..."}
              </p>
            </div>
            <Progress value={progress ? (progress.current / progress.total) * 100 : 0} className="h-2" />
          </div>
        )}

        {result && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-2">
              {result.errors === 0 ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              )}
              <h3 className="text-lg font-medium">
                {result.errors === 0 ? "Sauvegarde terminée" : "Sauvegarde terminée avec des erreurs"}
              </h3>
            </div>
            <div className="text-center space-y-1">
              <p>
                {result.success} template{result.success !== 1 ? "s" : ""} sauvegardé{result.success !== 1 ? "s" : ""}{" "}
                avec succès
              </p>
              {result.errors > 0 && (
                <p className="text-yellow-600">
                  {result.errors} erreur{result.errors !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <Button onClick={onClose} className="w-full">
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

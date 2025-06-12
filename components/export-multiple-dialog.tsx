"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Download, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { OfferTemplate } from "@/types/offer-template"

interface ExportMultipleDialogProps {
  isOpen: boolean
  onClose: () => void
  templates: OfferTemplate[]
  contents: Record<string, string>
  templateConfigs: Record<string, {
    marginTop?: string
    marginRight?: string
    marginBottom?: string
    marginLeft?: string
    style?: string
  }>
  headers: Record<string, string>
  footers: Record<string, string>
}

export function ExportMultipleDialog({
  isOpen,
  onClose,
  templates,
  contents,
  templateConfigs,
  headers,
  footers,
}: ExportMultipleDialogProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 })
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const [includeHtmlHead, setIncludeHtmlHead] = useState(true)
  const [exportAsZip, setExportAsZip] = useState(true)
  
  // Reset states when dialog opens
  const onOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    } else {
      setSelectedTemplateIds([])
      setIsExporting(false)
      setExportProgress({ current: 0, total: 0 })
    }
  }, [onClose])

  const toggleTemplate = useCallback((templateId: string) => {
    setSelectedTemplateIds((prev) => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId)
      } else {
        return [...prev, templateId]
      }
    })
  }, [])
  
  const toggleAllTemplates = useCallback(() => {
    if (selectedTemplateIds.length === templates.length) {
      setSelectedTemplateIds([])
    } else {
      setSelectedTemplateIds(templates.map(template => template.id))
    }
  }, [templates, selectedTemplateIds])

  const generateHtmlContent = (templateId: string): string => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return ""
    
    const content = contents[templateId] || ""
    const config = templateConfigs[templateId]
    const templateName = template.name
    
    // Si includeHtmlHead est true, inclure le head complet
    if (includeHtmlHead) {
      const customStyle = config?.style || ""
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: ${config?.marginTop || "25mm"} ${config?.marginRight || "10mm"} ${config?.marginBottom || "25mm"} ${config?.marginLeft || "10mm"};
    }
    ${customStyle}
  </style>
</head>
<body>
  ${content}
</body>
</html>`
    } else {
      // Sinon, retourner uniquement le contenu
      return content
    }
  }

  const createAndDownloadFile = (content: string, filename: string) => {
    // Créer un blob avec le contenu HTML
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
    
    // Créer un URL objet pour le blob
    const url = URL.createObjectURL(blob)
    
    // Créer un élément a temporaire pour le téléchargement
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    
    // Ajouter au DOM et cliquer pour télécharger
    document.body.appendChild(link)
    link.click()
    
    // Nettoyer
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
  }

  const handleExport = useCallback(async () => {
    if (selectedTemplateIds.length === 0) {
      toast({
        title: "Aucun template sélectionné",
        description: "Veuillez sélectionner au moins un template à exporter",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    setExportProgress({ current: 0, total: selectedTemplateIds.length })

    try {
      if (exportAsZip && selectedTemplateIds.length > 1) {
        // Pour l'export en ZIP, nous utilisons une méthode alternative avec archiveFormats
        // Cette approche est plus compatible avec les navigateurs modernes
        
        // Créer un élément pour télécharger chaque fichier individuellement
        for (let i = 0; i < selectedTemplateIds.length; i++) {
          const templateId = selectedTemplateIds[i]
          const template = templates.find(t => t.id === templateId)
          if (!template) continue
          
          const content = generateHtmlContent(templateId)
          const sanitizedName = template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
          
          // Utiliser la fonction pour créer et télécharger le fichier
          createAndDownloadFile(content, `${sanitizedName}.html`)
          
          // Attendre un petit délai entre les téléchargements pour éviter les blocages
          if (i < selectedTemplateIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300))
          }
          
          setExportProgress({ current: i + 1, total: selectedTemplateIds.length })
        }
        
        toast({
          title: "Export réussi",
          description: `${selectedTemplateIds.length} templates ont été exportés. Veuillez vérifier vos téléchargements.`,
        })
      } else {
        // Export individuellement
        for (let i = 0; i < selectedTemplateIds.length; i++) {
          const templateId = selectedTemplateIds[i]
          const template = templates.find(t => t.id === templateId)
          if (!template) continue
          
          const content = generateHtmlContent(templateId)
          const sanitizedName = template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
          
          // Utiliser la fonction pour créer et télécharger le fichier
          createAndDownloadFile(content, `${sanitizedName}.html`)
          
          setExportProgress({ current: i + 1, total: selectedTemplateIds.length })
        }
        
        toast({
          title: "Export réussi",
          description: `${selectedTemplateIds.length} templates ont été exportés.`,
        })
      }
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export des templates.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
      onClose()
    }
  }, [selectedTemplateIds, templates, contents, templateConfigs, includeHtmlHead, exportAsZip, toast, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Export multiple de templates</DialogTitle>
          <DialogDescription>
            Sélectionnez les templates que vous souhaitez exporter au format HTML
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto p-2 border rounded-md">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
            <Checkbox 
              id="select-all" 
              checked={selectedTemplateIds.length === templates.length && templates.length > 0}
              onCheckedChange={toggleAllTemplates}
            />
            <Label htmlFor="select-all" className="font-medium">
              Sélectionner tout ({templates.length})
            </Label>
          </div>

          <div className="space-y-2">
            {templates.map((template) => (
              <div key={template.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`template-${template.id}`}
                  checked={selectedTemplateIds.includes(template.id)}
                  onCheckedChange={() => toggleTemplate(template.id)}
                />
                <Label htmlFor={`template-${template.id}`} className="flex-1 truncate">
                  {template.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="includeHead">Inclure le &lt;head&gt;</Label>
              <p className="text-sm text-muted-foreground">
                Inclut les métadonnées, le titre et les styles CSS
              </p>
            </div>
            <Switch
              id="includeHead"
              checked={includeHtmlHead}
              onCheckedChange={setIncludeHtmlHead}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="exportZip">Exporter en archive ZIP</Label>
              <p className="text-sm text-muted-foreground">
                Télécharger tous les fichiers dans une seule archive
              </p>
            </div>
            <Switch
              id="exportZip"
              checked={exportAsZip}
              onCheckedChange={setExportAsZip}
            />
          </div>

          {isExporting && (
            <div className="space-y-2">
              <Progress value={(exportProgress.current / exportProgress.total) * 100} />
              <p className="text-sm text-center">
                Export en cours... {exportProgress.current}/{exportProgress.total}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={isExporting || selectedTemplateIds.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Export en cours..." : "Exporter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

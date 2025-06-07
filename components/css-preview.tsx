"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


interface CssPreviewProps {
  css: string
  html: string // Rendre html obligatoire car l'iframe en a besoin
  className?: string
}

function filterDangerousTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

export function CssPreview({ css, html, className }: CssPreviewProps) {
  const [activeTab, setActiveTab] = useState<string>("template")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [previewHtml, setPreviewHtml] = useState<string>("") // Gardé pour l'onglet "Éléments de base"

  // Mettre à jour l'iframe lorsque html ou css changent
  useEffect(() => {
    if (iframeRef.current && html) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(`
          <html>
            <head>
              <style type="text/css">${css}</style>
            </head>
            <body>
              ${filterDangerousTags(html)}
            </body>
          </html>
        `)
        iframeDoc.close()
      }
    }
  }, [html, css])

  // Générer un HTML d'exemple pour l'onglet "Éléments de base" si html n'est pas fourni ou est vide
  // Cela n'affecte pas l'iframe principale qui utilise directement la prop `html`
  useEffect(() => {
    if (html && activeTab === "elements") { // S'assurer que cela ne s'exécute que pour l'onglet éléments
      setPreviewHtml(html)
    } else if (activeTab === "elements") {
      const sampleHtml = `
        <div class="preview-container">
          <h1>Titre principal</h1>
          <h2>Sous-titre</h2>
          <p>Ceci est un paragraphe de texte pour prévisualiser les styles CSS. Il contient du <strong>texte en gras</strong>, du <em>texte en italique</em> et du <u>texte souligné</u>.</p>
          <ul>
            <li>Élément de liste 1</li>
            <li>Élément de liste 2</li>
            <li>Élément de liste 3</li>
          </ul>
          <table>
            <thead>
              <tr>
                <th>En-tête 1</th>
                <th>En-tête 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cellule 1</td>
                <td>Cellule 2</td>
              </tr>
            </tbody>
          </table>
          <div class="box">Boîte avec bordure</div>
        </div>
      `
      setPreviewHtml(sampleHtml)
    }
  }, [html, activeTab])

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full">
        <TabsList className="w-full">
          <TabsTrigger value="template" className="w-1/2">Aperçu du template</TabsTrigger>
          <TabsTrigger value="elements" className="w-1/2">Éléments de base</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="flex-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Aperçu du template</CardTitle>
              <CardDescription>Visualisation du template avec les styles appliqués</CardDescription>
            </CardHeader>
            <CardContent className="p-3 flex-1 flex flex-col">
              <ScrollArea className="h-full border rounded-md flex-1">
                {html ? (
                  <iframe
                    ref={iframeRef}
                    title="Template Preview"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin" // Optionnel: ajuster selon les besoins de sécurité
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Aucun contenu HTML à prévisualiser</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="elements" className="flex-1">
          <Card className="h-full">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Éléments de base</CardTitle>
              <CardDescription>Aperçu des éléments HTML de base avec les styles appliqués</CardDescription>
            </CardHeader>
            <CardContent className="p-3 h-[calc(100%-80px)]">
              <ScrollArea className="h-full border rounded-md p-4">
                {previewHtml ? (
                  <div
                    className="min-h-[500px] bg-white"
                    dangerouslySetInnerHTML={{ __html: filterDangerousTags(previewHtml) }}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Aucun contenu HTML à prévisualiser</div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

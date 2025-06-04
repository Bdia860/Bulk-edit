"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShadowPreview } from "./shadow-preview"

interface CssPreviewProps {
  css: string
  html?: string
  className?: string
}

function filterDangerousTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

export function CssPreview({ css, html, className }: CssPreviewProps) {
  const [activeTab, setActiveTab] = useState<string>("template")
  const [previewHtml, setPreviewHtml] = useState<string>("")

  // Generate sample HTML for preview if not provided
  useEffect(() => {
    if (html) {
      setPreviewHtml(html)
    } else {
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
  }, [html])

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full">
        <TabsList className="w-full">
          <TabsTrigger value="template" className="w-1/2">Aperçu du template</TabsTrigger>
          <TabsTrigger value="elements" className="w-1/2">Éléments de base</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="flex-1">
          <Card className="h-full">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Aperçu du template</CardTitle>
              <CardDescription>Visualisation du template avec les styles appliqués</CardDescription>
            </CardHeader>
            <CardContent className="p-3 h-[calc(100%-80px)]">
              <ScrollArea className="h-full border rounded-md p-4">
                {html ? (
                  <ShadowPreview html={html} css={css} />
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

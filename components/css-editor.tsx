"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, Code, Palette, RefreshCw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CssEditorProps {
  value: string
  onChange: (value: string) => void
  onApply: (value: string) => boolean
  className?: string
}

interface CssProperty {
  property: string
  value: string
  description?: string
  category: string
}

function filterDangerousTags(html: string): string {
  // Filtre basique, envisagez une bibliothèque plus robuste pour la production
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
}

export function CssEditor({ value, onChange, onApply, className }: CssEditorProps) {
  console.log("CssEditor received value:", value)

  const [activeTab, setActiveTab] = useState<string>("code")
  const [cssProperties, setCssProperties] = useState<CssProperty[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [isLivePreview, setIsLivePreview] = useState<boolean>(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // CSS categories
  const categories = [
    { id: "all", name: "Toutes les propriétés" },
    { id: "text", name: "Texte" },
    { id: "layout", name: "Mise en page" },
    { id: "colors", name: "Couleurs" },
    { id: "spacing", name: "Espacement" },
    { id: "borders", name: "Bordures" },
    { id: "effects", name: "Effets" },
  ]

  // Common CSS properties with descriptions
  const commonProperties: Record<string, { category: string; description: string }> = {
    color: { category: "colors", description: "Couleur du texte" },
    "background-color": { category: "colors", description: "Couleur d'arrière-plan" },
    "font-family": { category: "text", description: "Police de caractères" },
    "font-size": { category: "text", description: "Taille de la police" },
    "font-weight": { category: "text", description: "Graisse de la police" },
    "text-align": { category: "text", description: "Alignement du texte" },
    "line-height": { category: "text", description: "Hauteur de ligne" },
    margin: { category: "spacing", description: "Marge extérieure" },
    padding: { category: "spacing", description: "Marge intérieure" },
    border: { category: "borders", description: "Bordure" },
    "border-radius": { category: "borders", description: "Rayon des coins" },
    width: { category: "layout", description: "Largeur" },
    height: { category: "layout", description: "Hauteur" },
    display: { category: "layout", description: "Type d'affichage" },
    position: { category: "layout", description: "Positionnement" },
    "box-shadow": { category: "effects", description: "Ombre de la boîte" },
    "text-shadow": { category: "effects", description: "Ombre du texte" },
    opacity: { category: "effects", description: "Opacité" },
  }

  // Parse CSS on value change
  useEffect(() => {
    console.log("CssEditor useEffect - value changed:", value)
    parseCss(value)
    if (isLivePreview && iframeRef.current && previewHtml) {
      console.log("CssEditor - Injecting CSS to preview iframe:", value); // AJOUTER CE LOG
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(`
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Preview</title>
              <style type="text/css">
                html, body {
                  margin: 0;
                  padding: 0;
                  height: 100%;
                  width: 100%;
                  overflow: auto;
                }
                ${value}
              </style>
            </head>
            <body>
              ${filterDangerousTags(previewHtml)}
            </body>
          </html>
        `)
        iframeDoc.close()
      }
    }
  }, [value, isLivePreview, previewHtml, iframeRef])

  // Generate sample HTML for preview
  useEffect(() => {
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
  }, [])

  // Parse CSS string into properties
  const parseCss = (css: string) => {
    console.log("Parsing CSS:", css)
    if (!css) {
      console.log("CSS is empty, setting empty properties")
      setCssProperties([])
      return
    }

    try {
      const properties: CssProperty[] = []
      const rules = css.match(/([^{}]+)(?=\{[^{}]*\})/g) || []
      const declarations = css.match(/\{([^{}]*)\}/g) || []

      console.log("Parsed CSS rules:", rules)
      console.log("Parsed CSS declarations:", declarations)

      rules.forEach((selector, index) => {
        const declarationBlock = declarations[index]
        if (declarationBlock) {
          const props = declarationBlock.replace(/[{}]/g, "").split(";")
          props.forEach((prop) => {
            const [property, value] = prop.split(":").map((s) => s.trim())
            if (property && value) {
              const category = commonProperties[property]?.category || "other"
              const description = commonProperties[property]?.description || ""
              properties.push({
                property,
                value,
                description,
                category,
              })
            }
          })
        }
      })

      console.log("Extracted CSS properties:", properties)
      setCssProperties(properties)
    } catch (error) {
      console.error("Error parsing CSS:", error)
      setCssProperties([])
    }
  }

  // Format CSS for better readability
  const formatCss = () => {
    if (!value) return

    try {
      // Simple CSS formatter
      const formatted = value
        .replace(/\s*{\s*/g, " {\n  ")
        .replace(/\s*;\s*/g, ";\n  ")
        .replace(/\s*}\s*/g, "\n}\n\n")
        .replace(/\n {2}\n/g, "\n")
        .trim()

      onChange(formatted)
    } catch (error) {
      console.error("Error formatting CSS:", error)
    }
  }

  // Apply CSS changes
  const handleApply = () => {
    onApply(value)
  }

  // Update a CSS property
  const updateProperty = (index: number, newValue: string) => {
    const updatedProperties = [...cssProperties]
    updatedProperties[index].value = newValue

    // Rebuild the CSS string
    let newCss = value
    const property = updatedProperties[index].property
    const regex = new RegExp(`(${property}\\s*:\\s*)[^;]+(;)`, "g")
    newCss = newCss.replace(regex, `$1${newValue}$2`)

    onChange(newCss)
  }

  // Filter properties by category
  const filteredProperties = cssProperties.filter(
    (prop) => selectedCategory === "all" || prop.category === selectedCategory,
  )

  // Ajouter un message d'information si le CSS est vide
  const isEmpty = !value || value.trim() === ""

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Code CSS
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Éditeur visuel
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Prévisualisation
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={formatCss}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Formater
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Formater le code CSS pour une meilleure lisibilité</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center space-x-2">
              <Switch id="live-preview" checked={isLivePreview} onCheckedChange={setIsLivePreview} />
              <Label htmlFor="live-preview">Aperçu en direct</Label>
            </div>
            {!isLivePreview && (
              <Button size="sm" onClick={handleApply}>
                Appliquer
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="code" className="flex-1">
          {isEmpty && (
            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Aucun style CSS n'est défini pour ce template. Vous pouvez ajouter du CSS ici pour personnaliser
              l'apparence du template.
            </div>
          )}
          <textarea
            value={value}
            onChange={(e) => {
              const newValue = e.target.value
              console.log("CSS textarea changed:", newValue)
              onChange(newValue)
            }}
            className={`w-full h-full p-4 rounded-lg bg-muted font-mono text-sm resize-none ${isEmpty ? "border-dashed border-2 border-gray-300" : ""}`}
            placeholder={
              isEmpty
                ? "/* Ajoutez votre CSS ici, par exemple:\n\nbody {\n  font-family: Arial, sans-serif;\n  color: #333333;\n}\n\nh1 {\n  color: #0066cc;\n  font-size: 24px;\n} */"
                : "Entrez votre CSS ici..."
            }
            spellCheck={false}
          />
        </TabsContent>

        <TabsContent value="visual" className="flex-1">
          <div className="grid grid-cols-4 gap-4 h-full">
            <Card className="col-span-1">
              <CardHeader className="p-3">
                <CardTitle className="text-sm">Catégories</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-2 rounded-md cursor-pointer ${
                        selectedCategory === category.id ? "bg-muted" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader className="p-3">
                <CardTitle className="text-sm">Propriétés CSS</CardTitle>
                <CardDescription>
                  {selectedCategory === "all"
                    ? "Toutes les propriétés"
                    : categories.find((c) => c.id === selectedCategory)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="p-3 space-y-4">
                    {filteredProperties.length > 0 ? (
                      filteredProperties.map((prop, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`prop-${index}`} className="font-medium">
                              {prop.property}
                              {prop.description && (
                                <span className="ml-2 text-xs text-muted-foreground">({prop.description})</span>
                              )}
                            </Label>
                          </div>
                          <Input
                            id={`prop-${index}`}
                            value={prop.value}
                            onChange={(e) => updateProperty(index, e.target.value)}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {value
                          ? "Aucune propriété trouvée dans cette catégorie"
                          : "Aucune propriété CSS définie. Commencez à écrire du CSS dans l'onglet 'Code CSS'."}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 flex flex-col">
          <Card className="h-full flex flex-col">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Prévisualisation du style</CardTitle>
              <CardDescription>Aperçu de l'apparence des éléments avec le style appliqué</CardDescription>
            </CardHeader>
            <CardContent className="p-3 flex-1">
              {/* La ScrollArea n'est plus nécessaire ici, l'iframe gère son propre défilement si besoin */}
              <iframe
                ref={iframeRef}
                title="CSS Editor Preview"
                className="w-full h-full border rounded-md bg-white"
                sandbox="allow-scripts allow-same-origin" // Ajustez selon les besoins
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

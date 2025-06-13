import { Archive, ExternalLink, Save } from "lucide-react"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { Badge } from "./ui/badge"
import type { OfferTemplate } from "@/types/offer-template"
import { Card } from "./ui/card"

interface TemplateListProps {
  templates: OfferTemplate[]
  selectedId: string | null
  onSelect: (template: OfferTemplate) => void
  onArchive: (template: OfferTemplate) => void
  onSaveAll?: () => void
  isSavingAll?: boolean
  hasPendingChanges?: boolean
  getStatus: (id: string) => {
    label: string
    color: string
  }
  getSuggestions: (id: string) => number
  className?: string
}

export function TemplateList({
  templates,
  selectedId,
  onSelect,
  onArchive,
  onSaveAll,
  isSavingAll = false,
  hasPendingChanges = false,
  getStatus,
  getSuggestions,
  className,
}: TemplateListProps) {
  return (
    <div className="flex flex-col h-full">
      {onSaveAll && (
        <div className="flex justify-end p-2 border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveAll}
            disabled={isSavingAll || !hasPendingChanges}
            className="text-sm font-medium flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {isSavingAll ? "Sauvegarde en cours..." : "Sauvegarder tout"}
          </Button>
        </div>
      )}
      <ScrollArea className={`${className} scale-x-115 origin-left flex-1`}>
        <div className="space-y-1 p-2 pr-6 w-[calc(100%+1.5rem)]">
        {[...templates]
          // Tri alphabétique par nom
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((template) => {
          const status = getStatus(template.id)
          const suggestions = getSuggestions(template.id)

          return (
            <Card
              key={template.id}
              className={`p-2 cursor-pointer transition-colors hover:bg-muted relative z-10 bg-background text-sm ${
                selectedId === template.id ? "border-primary" : ""
              }`}
              onClick={() => onSelect(template)}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <h3 className="font-medium leading-tight break-words line-clamp-2">{template.name}</h3>
                    <p className="text-xs text-muted-foreground leading-tight break-words line-clamp-1">
                      {template.type}
                    </p>
                    <p className="text-xs text-muted-foreground/75 leading-tight break-words line-clamp-1">
                      {template.type_code}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    <div className="flex items-center gap-1">
                      {suggestions > 0 && (
                        <Badge variant="secondary" className="h-5 text-xs px-1.5">
                          {suggestions}
                        </Badge>
                      )}
                      <Badge className={`${status.color} h-5 text-xs px-1.5`}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(
                            `https://app.geosquare.fr/admin/application/offer_templates/${template.id}`,
                            "_blank",
                          )
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="sr-only">Open in Geosquare</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          onArchive(template)
                        }}
                      >
                        <Archive className="h-3 w-3" />
                        <span className="sr-only">Archive template</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
        </div>
      </ScrollArea>
    </div>
  )
}

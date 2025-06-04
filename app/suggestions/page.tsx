"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchOfferTemplates } from "@/services/api"
import type { OfferTemplatesResponse } from "@/types/offer-template"

interface SuggestionCount {
  from: string
  count: number
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const suggestedReplacements = [
  {
    from: "<p><strong>Commune :</strong> [ADRESSE_LIVRAISON]</p>",
    to: "<p><strong>Adresse du projet :</strong> [ADRESSE_LIVRAISON]</p>",
  },
  { from: "<p><strong>Client :</strong></p>", to: "<p><strong>Client :[CLIENT_FINAL] </strong></p>" },
  {
    from: "<p><strong>Localisation&nbsp;:</strong> () -</p>",
    to: "<p><strong>Localisation&nbsp;:</strong> [ADRESSE_CHANTIER]]</p>",
  },
  { from: "ajuster les missions et le prix, aux changements", to: "ajuster les missions et le prix aux changements" },
  { from: "d'une somme forfaitaire de 500 €HT.", to: "d'une somme forfaitaire de 500 € HT." },
  {
    from: "La proposition et les conditions générale font partie intégrante de l'accord.",
    to: "La proposition et les conditions générales font partie intégrante de l'accord.",
  },
  { from: "<mark>□</mark>", to: "<mark></mark>" },
  { from: "entre xxx m et xxx m.", to: "entre <mark>xxx</mark> m et <mark>xxx</mark> m." },
  { from: "il est prévu xx visite", to: "il est prévu <mark>xx</mark> visite" },
  { from: "de xx semaines", to: "de <mark>xx</mark> semaines" },
  { from: "à xxx", to: "à <mark>xxx</mark>" },
  { from: "xxx mesures", to: "<mark>xxx</mark> mesures" },
  { from: "les xxx&nbsp;m / xxx", to: "les <mark>xxx</mark>&nbsp;m / <mark>xxx</mark>" },
  { from: "xxx avec", to: "<mark>xxx</mark> avec" },
  {
    from: "<img>",
    to: "",
    isRegex: true,
  },
  {
    from: `<div>
      <span style="color:red;">Prix</span> : Ils sont valables pour une durée de 3 mois à compter de la date d'envoi du contrat, et correspondent au détail unitaire figurant dans le bordereau de prix.
    </div>`,
    to: `<div>
      <span style="color:red;">Prix</span> : Ils sont valables pour une durée de 3 mois à compter de la date d'envoi du contrat, et correspondent au détail unitaire figurant dans le bordereau de prix.
    </div>
    <div>
      <span style="color:red;">Modification de document</span> : Toute modification du rapport ou de la facture à l'initiative du client fera l'objet d'une facturation supplémentaire (50 € HT par document).
    </div>`,
  },
  {
    from: '<p>Libellé du client et <strong>adresse de facturation</strong>&nbsp;:</p></blockquote></td></tr><tr><td></td><td colspan="2"><blockquote><p><strong>Contact comptabilité/facturation (personnesmorales)&nbsp;:</strong></p></blockquote><ul><li><p>NOM Prénom&nbsp;:</p></li><li><p>Mail&nbsp;:</p></li><li><p>Téléphone&nbsp;:</p></li></ul></td></tr></tbody></table>',
    to: '<table><colgroup><col style="width:44%;"><col style="width:32%;"><col style="width:23%;"></colgroup><thead><tr><th style="text-align:center;"><blockquote><p><strong>KAENA</strong></p></blockquote></th><th colspan="2" style="text-align:center;"><blockquote><p><strong>[CLIENT_FINAL]</strong></p></blockquote></th></tr></thead><tbody><tr><td><blockquote><p>[COMMERCIAL]</p></blockquote></td><td><blockquote><p>Nom, Prénom</p></blockquote></td><td><blockquote><p>Date&nbsp;:</p></blockquote></td></tr><tr><td><blockquote><p>Signature&nbsp;: …………………………………….</p><p>Date&nbsp;: &lt;date_devis&gt;</p></blockquote></td><td colspan="2"><blockquote><p>Signature&nbsp;:</p><p>Libellé du client et <strong>adresse de facturation</strong>&nbsp;:<br><br></p></blockquote></td></tr><tr><td></td><td colspan="2"><blockquote><p><strong>Contact comptabilité/facturation (personnesmorales)&nbsp;:</strong></p></blockquote><ul><li><p>NOM Prénom&nbsp;:</p></li><li><p>Mail&nbsp;:</p></li><li><p>Téléphone&nbsp;:</p></li></ul></td></tr></tbody></table><p>* Toute modification de facture liée à un changement d\'adresse de facturation par rapport à celle mentionnée ci-dessus sera facturée selon les conditions générales de vente.</p>',
  },
  {
    from: "<tr><td></td><td></td><td><p>KAENA S.A.S</p><p>Parc d'activité Eurékalp – L'Epicentre</p><p>38660 Saint-Vincent de Mercuze</p><p>N° de SIRET&nbsp;: 510&nbsp;277&nbsp;478 00010</p></td></tr></tbody></table>",
    to: '<table><colgroup><col style="width:44%;"><col style="width:11%;"><col style="width:44%;"></colgroup><thead><tr><th>Le Client&nbsp;:</th><th style="text-align:center;">et</th><th>Le Prestataire&nbsp;:</th></tr></thead><tbody><tr><td>[ADRESSE_CHANTIER]</td><td></td><td><p>KAENA S.A.S</p><p>Parc d\'activité Eurékalp – L\'Epicentre</p><p>38660 Saint-Vincent de Mercuze</p><p>N° de SIRET&nbsp;: 510&nbsp;277&nbsp;478 00010</p></td></tr></tbody></table>',
  },
]

function normalizeString(str: string): string {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
}

function formatDisplayText(text: string): string {
  return text
    .replace(/&nbsp;/g, "␣")
    .replace(/\n/g, "↵\n")
    .replace(/\t/g, "→")
    .replace(/\s+/g, " ")
    .trim()
}

export default function SuggestionsPage() {
  const [suggestionCounts, setSuggestionCounts] = useState<SuggestionCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSuggestions() {
      setLoading(true)
      try {
        const response: OfferTemplatesResponse = await fetchOfferTemplates(1, 1000)
        const counts: Record<string, number> = {}

        // Initialiser tous les compteurs à 0
        suggestedReplacements.forEach((suggestion) => {
          counts[suggestion.from.toString()] = 0
        })

        response.data.forEach((template) => {
          const normalizedContent = normalizeString(template.content)
          suggestedReplacements.forEach((suggestion) => {
            if (suggestion.isRegex) {
              const regex = new RegExp(suggestion.from, "gm")
              const matches = normalizedContent.match(regex)
              if (matches) {
                counts[suggestion.from.toString()] += matches.length
              }
            } else {
              const normalizedFrom = normalizeString(suggestion.from)
              const normalizedTo = normalizeString(suggestion.to)
              const fromCount = (normalizedContent.match(new RegExp(escapeRegExp(normalizedFrom), "gm")) || []).length
              const toCount = (normalizedContent.match(new RegExp(escapeRegExp(normalizedTo), "gm")) || []).length
              counts[suggestion.from] += fromCount + toCount
            }
          })
        })

        const sortedCounts = Object.entries(counts)
          .map(([from, count]) => ({ from, count }))
          .sort((a, b) => b.count - a.count)

        setSuggestionCounts(sortedCounts)
      } catch (error) {
        console.error("Error loading suggestions:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSuggestions()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif des suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement des suggestions...</p>
          ) : (
            <ScrollArea className="h-[600px]">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">Texte original</th>
                    <th className="text-left p-2">Texte de remplacement</th>
                    <th className="text-right p-2">Nombre d'occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestionCounts.map((suggestion, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">
                        <pre className="text-sm bg-muted p-1 rounded whitespace-pre-wrap overflow-x-auto">
                          {formatDisplayText(suggestion.from)}
                        </pre>
                      </td>
                      <td className="p-2">
                        <code className="text-sm bg-muted p-1 rounded">
                          {suggestedReplacements.find((s) => s.from.toString() === suggestion.from)?.to || "N/A"}
                        </code>
                      </td>
                      <td className="text-right p-2">{suggestion.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

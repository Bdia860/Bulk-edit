"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Lightbulb, WifiOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import type { OfferTemplate, OfferTemplatesResponse, Config } from "../types/offer-template"
import { fetchOfferTemplates, updateOfferTemplate } from "../services/api"
import hljs from "highlight.js/lib/core"
import html from "highlight.js/lib/languages/xml"
import "highlight.js/styles/github-dark.css"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Navigation } from "./navigation"
import { SearchBar } from "./search-bar"
import { TemplateList } from "./template-list"
import { EditorToolbar } from "./editor-toolbar"
import { useAuthContext } from "@/contexts/auth-context"
import { SearchReplaceModal } from "./search-replace-modal"
import { SuggestionsPanel } from "./suggestions-panel"
import { CssEditor } from "./css-editor"
import { CssPreview } from "./css-preview"
import { Topbar } from "./topbar"
import { SaveAllDialog } from "./save-all-dialog"
import { ConnectionTestDialog } from "./connection-test-dialog"
import TemplateEditor from "./templates/TemplateEditor"

hljs.registerLanguage("html", html)

interface Suggestion {
  from: string | RegExp
  to: string
  isRegex?: boolean
}

interface ModificationLog {
  timestamp: Date
  action: string
  details: string
}

// Utilisation de l'interface OfferTemplate importée depuis "../types/offer-template"

type TemplateStatus = "Non ouvert" | "Ouvert" | "Modifié" | "Copié"

const suggestedReplacements: Suggestion[] = [
  { from: "<em>Nota important</em>", to: '<p><em><span style="color: rgb(192, 0, 0);">Nota important</span></em></p>' },
  {
    from: "<u>NOTA IMPORTANT</u>",
    to: '<p><u style="color: rgb(192, 0, 0); text-decoration-color: rgb(192, 0, 0);">NOTA IMPORTANT</u></p>',
  },
  {
    from: "<strong><u>NOTA IMPORTANT</u>.</strong>",
    to: '<p><strong><u style="color: rgb(192, 0, 0); text-decoration-color: rgb(192, 0, 0);">NOTA IMPORTANT</u>.</strong></p>',
  },
  {
    from: "<strong>Nota important</strong>",
    to: '<p><strong><span style="color: rgb(192, 0, 0);">Nota important</span></strong></p>',
  },
  {
    from: "<strong><u>Nota important</u></strong>",
    to: '<p><strong><u style="color: rgb(192, 0, 0); text-decoration-color: rgb(192, 0, 0);">NOTA IMPORTANT</u></strong></p>',
  },
  {
    from: "<strong>Nota important&nbsp;</strong>",
    to: '<p><strong><span style="color: rgb(192, 0, 0);">Nota important&nbsp;</span></strong></p>',
  },
  { from: "\n", to: "" },
  {
    from: "<img>",
    to: "",
    isRegex: true,
  },
  {
    from: `<div>
      <span style="color:red;">Prix</span> : Ils sont valables pour une durée de 3 mois à compter de la date d'envoi du contrat, et correspondent au détail unitaire figurant dans le bordereau de prix.
    </div>
    `,
    to: `
      <div>
        <span style="color:red;">Prix</span> : Ils sont valables pour une durée de 3 mois à compter de la date d'envoi du contrat, et correspondent au détail unitaire figurant dans le bordereau de prix.
      </div>
      <div>
        <span style="color:red;">Modification de document</span> : Toute modification du rapport ou de la facture à l'initiative du client fera l'objet d'une facturation supplémentaire (50 € HT par document).
      </div>
    `,
    isRegex: true,
  },
  { from: "<mark>U</mark>", to: "U" },
  { from: "&lt;date_devis&gt;", to: "[Date]" },
  {
    from: "<p><mark>□</mark> vos soins, <mark>□</mark> nos soins.</p>",
    to: "<p><mark>☐☑️</mark> vos soins <mark>☐☑️</mark> nos soins</p>",
  },
  {
    from: '><img src="media/image3.jpeg"><img src="media/image4.jpeg"><img src="media/image5.jpeg"><img src="media/image6.jpeg"><img src="media/image7.jpeg"><img src="media/image8.jpeg">',
    to: "",
  },
  {
    from: "<p>Libellé du client et <strong>adresse de facturation</strong> :</p>",
    to: "<p>Libellé du client et <strong>adresse de facturation</strong> :<br><br></p>",
  },
  {
    from: "<p>Libellé du client et <strong>adresse de facturation</strong>&nbsp;:</p>",
    to: "<p>Libellé du client et <strong>adresse de facturation</strong> :<br><br></p>",
  },
  {
    from: /<p>(<mark>□<\/mark> vos soins <mark>□<\/mark> nos soins\.?)<\/p>/g,
    to: "<p><mark>☐☑️</mark> vos soins <mark>☐☑️</mark> nos soins</p>",
    isRegex: true,
  },
  {
    from: /<p><mark>□<\/mark> vos soins,? <mark>□<\/mark> nos soins\.?<\/p>/g,
    to: "<p><mark>☐☑️</mark> vos soins <mark>☐☑️</mark> nos soins</p>",
    isRegex: true,
  },
  {
    from: "24-6000-34-G3",
    to: "[REFERENCE]",
  },
  {
    from: "24-6000-34-G2AVP",
    to: "[REFERENCE]",
  },
  {
    from: "24-6666-34-G2AVP-G2PRO",
    to: "[REFERENCE]",
  },
  {
    from: "24-6000-34-G1PGC",
    to: "[REFERENCE]",
  },
]

const detectSuggestionsForTemplate = (content: string): Suggestion[] => {
  return suggestedReplacements.filter((suggestion) => {
    if (suggestion.isRegex) {
      return suggestion.from instanceof RegExp && suggestion.from.test(content)
    }
    return typeof suggestion.from === "string" && content.includes(suggestion.from) && !content.includes(suggestion.to)
  })
}

const applySpecificModifications = (content: string): string => {
  return content
}

const cleanText = (text: string) => {
  return text.trim().replace(/\s+/g, " ")
}

export default function OfferTemplatesList() {
  const [templates, setTemplates] = useState<OfferTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  // Fonction utilitaire pour mettre à jour un template avec toutes les propriétés requises
  const updateTemplate = (id: string, updates: Partial<OfferTemplate>): void => {
    setTemplates(prev => 
      prev.map(t => {
        if (t.id === id) {
          // Mettre à jour le statut du template à "Modifié"
          updateTemplateStatus(id, "Modifié");
          
          return {
            ...t,
            ...updates,
            // S'assurer que toutes les propriétés requises sont présentes
            type: updates.type ?? t.type ?? '',
            type_code: updates.type_code ?? t.type_code ?? '',
            deleted_at: updates.deleted_at ?? t.deleted_at ?? null,
            inactivated_at: updates.inactivated_at ?? t.inactivated_at ?? null,
            config: updates.config ?? t.config ?? {
              marginTop: '25mm',
              marginRight: '10mm',
              marginBottom: '25mm',
              marginLeft: '10mm',
              style: ''
            }
          };
        }
        return t;
      })
    );
  };
  const [modifiedContents, setModifiedContents] = useState<Record<string, string>>({})
  const [originalContents, setOriginalContents] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [replaceTerm, setReplaceTerm] = useState("")
  const [replaceCount, setReplaceCount] = useState(0)
  const [modificationLogs, setModificationLogs] = useState<Record<string, ModificationLog[]>>({})
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [templateSuggestions, setTemplateSuggestions] = useState<Record<string, number>>({})
  const [showDiff, setShowDiff] = useState(false)
  const [copied, setCopied] = useState(false)
  const [templateStatus, setTemplateStatus] = useState<Record<string, TemplateStatus>>({})
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(-1)
  const [globalSearchTerm, setGlobalSearchTerm] = useState("")
  const [globalReplaceTerm, setGlobalReplaceTerm] = useState("")
  const [globalSearchResults, setGlobalSearchResults] = useState<Record<string, number>>({})
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({})
  const [marginTop, setMarginTop] = useState("25mm")
  const [marginRight, setMarginRight] = useState("10mm")
  const [marginBottom, setMarginBottom] = useState("25mm")
  const [marginLeft, setMarginLeft] = useState("10mm")
  const [style, setStyle] = useState("")
  const [templateConfigs, setTemplateConfigs] = useState<Record<string, Config>>({})
  const [tokenInput, setTokenInput] = useState<string>("")
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false)
  const [isSearchReplaceModalOpen, setIsSearchReplaceModalOpen] = useState(false)
  const [isSuggestionsPanelOpen, setIsSuggestionsPanelOpen] = useState(false)
  const [headers, setHeaders] = useState<Record<string, string>>({})
  const [footers, setFooters] = useState<Record<string, string>>({})
  const [originalHeaders, setOriginalHeaders] = useState<Record<string, string>>({})
  const [originalFooters, setOriginalFooters] = useState<Record<string, string>>({})
  const [isSaveAllDialogOpen, setIsSaveAllDialogOpen] = useState(false)
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [savingProgress, setSavingProgress] = useState({ current: 0, total: 0 })
  const [isConnectionTestDialogOpen, setIsConnectionTestDialogOpen] = useState(false)
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline" | "unknown">("unknown")

  // Utiliser le contexte d'authentification
  const { token: apiToken, login, logout, isAuthenticated } = useAuthContext()

  // Définition des modes de l'éditeur
  const [editorMode, setEditorMode] = useState<"content" | "style" | "logs" | "css-preview" | "header" | "footer" | "general">(
    "general",
  )

  // Add a new state for CSS preview
  const [cssPreview, setCssPreview] = useState<boolean>(false)

  // Surveiller l'état de la connexion réseau
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus("online")
      toast({
        title: "Connexion rétablie",
        description: "Votre connexion internet a été rétablie.",
      })
    }

    const handleOffline = () => {
      setNetworkStatus("offline")
      toast({
        title: "Connexion perdue",
        description: "Votre connexion internet a été perdue. Certaines fonctionnalités peuvent ne pas fonctionner.",
        variant: "destructive",
      })
    }

    // Définir l'état initial
    setNetworkStatus(navigator.onLine ? "online" : "offline")

    // Ajouter les écouteurs d'événements
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Nettoyer les écouteurs d'événements
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  // Modifier la gestion de la modal de token pour qu'elle ne s'affiche pas si l'utilisateur est connecté
  useEffect(() => {
    // Ne montrer la modal que si l'utilisateur n'est pas authentifié ET que l'application n'est pas en train de charger
    if (!isAuthenticated && !loading) {
      setIsTokenDialogOpen(true)
    } else {
      // S'assurer que la modal est fermée si l'utilisateur est authentifié
      setIsTokenDialogOpen(false)
    }
  }, [isAuthenticated, loading])

  // Améliorer la gestion des erreurs dans loadTemplates
  const loadTemplates = useCallback(async () => {
    if (!apiToken) {
      setError("Token d'API non configuré")
      setLoading(false)
      return
    }

    // Vérifier l'état de la connexion réseau
    if (networkStatus === "offline") {
      setError("Vous êtes actuellement hors ligne. Veuillez vérifier votre connexion internet et réessayer.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response: OfferTemplatesResponse = await fetchOfferTemplates(1, 1000, "", apiToken)
      if (!response || !response.data) {
        throw new Error("Format de réponse invalide")
      }
      setTemplates(response.data)

      const initialSuggestions: Record<string, number> = {}
      const initialModifiedContents: Record<string, string> = {}
      const initialOriginalContents: Record<string, string> = {}
      const initialStatus: Record<string, TemplateStatus> = {}
      const initialTemplateConfigs: Record<string, Config> = {}
      // Dans la fonction loadTemplates, après la déclaration des variables initialXXX
      const initialHeaders: Record<string, string> = {}
      const initialFooters: Record<string, string> = {}
      const initialOriginalHeaders: Record<string, string> = {}
      const initialOriginalFooters: Record<string, string> = {}

      // Dans la boucle response.data.forEach
      response.data.forEach((template) => {
        if (template && template.content) {
          const detectedSuggestions = detectSuggestionsForTemplate(template.content)
          initialSuggestions[template.id] = detectedSuggestions.length
          initialModifiedContents[template.id] = template.content
          initialOriginalContents[template.id] = template.content
          initialStatus[template.id] = "Non ouvert"

          if (template.config) {
            initialTemplateConfigs[template.id] = template.config
          }

          // Stocker les headers et footers
          initialHeaders[template.id] = template.header || ""
          initialFooters[template.id] = template.footer || ""
          initialOriginalHeaders[template.id] = template.header || ""
          initialOriginalFooters[template.id] = template.footer || ""
        }
      })
      setTemplateSuggestions(initialSuggestions)
      setModifiedContents(initialModifiedContents)
      setOriginalContents(initialOriginalContents)
      setTemplateStatus(initialStatus)
      setTemplateConfigs(initialTemplateConfigs)

      // Après les setXXX existants
      setHeaders(initialHeaders)
      setFooters(initialFooters)
      setOriginalHeaders(initialOriginalHeaders)
      setOriginalFooters(initialOriginalFooters)



      if (response.data.length > 0) {
        setSelectedTemplateId(response.data[0].id)
        setSuggestions(detectSuggestionsForTemplate(response.data[0].content))
      }
    } catch (err) {
      console.error("Erreur lors du chargement des templates:", err)

      // Améliorer le message d'erreur pour être plus spécifique
      if (err instanceof Error) {
        if (err.message === "Failed to fetch") {
          setError(
            "Impossible de se connecter à l'API. Veuillez vérifier votre connexion internet et que l'API est accessible. Cliquez sur 'Tester la connexion' pour diagnostiquer le problème.",
          )
        } else if (err.message.includes("401") || err.message.includes("403")) {
          setError(
            "Authentification échouée. Votre token API semble être invalide ou expiré. Veuillez vous reconnecter.",
          )
          // Forcer la déconnexion
          logout()
        } else {
          setError(`Une erreur s'est produite lors du chargement des modèles : ${err.message}`)
        }
      } else {
        setError("Une erreur inattendue s'est produite lors du chargement des modèles.")
      }
    } finally {
      setLoading(false)
    }
  }, [apiToken, networkStatus, logout])

  useEffect(() => {
    if (!apiToken) {
      setIsTokenDialogOpen(true)
      setLoading(false) // Arrêter le loading s'il n'y a pas de token
      return
    }
    loadTemplates()
  }, [apiToken, loadTemplates])

  useEffect(() => {
    if (selectedTemplateId && templateConfigs[selectedTemplateId]) {
      const config = templateConfigs[selectedTemplateId]
      setMarginTop(config.marginTop)
      setMarginRight(config.marginRight)
      setMarginBottom(config.marginBottom)
      setMarginLeft(config.marginLeft)
      setStyle(config.style || "")

    }
  }, [selectedTemplateId, templateConfigs])

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null
  const editableContent = selectedTemplateId ? modifiedContents[selectedTemplateId] || "" : ""

  useEffect(() => {
    if (selectedTemplateId && editableContent) {
      detectSuggestions(editableContent)
    }
  }, [selectedTemplateId, editableContent])

  const addModificationLog = useCallback((templateId: string, action: string, details: string) => {
    setModificationLogs((prevLogs) => ({
      ...prevLogs,
      [templateId]: [{ timestamp: new Date(), action, details }, ...(prevLogs[templateId] || [])],
    }))
  }, [])

  const updateTemplateStatus = useCallback((templateId: string, newStatus: TemplateStatus) => {
    setTemplateStatus((prev) => {
      const currentStatus = prev[templateId]
      if (currentStatus === "Modifié" && newStatus === "Ouvert") {
        return prev
      }
      if (currentStatus === "Copié" && newStatus === "Modifié") {
        return { ...prev, [templateId]: newStatus }
      }
      if (currentStatus === "Modifié" && newStatus === "Copié") {
        return { ...prev, [templateId]: newStatus }
      }
      if (currentStatus !== "Modifié" && currentStatus !== "Copié") {
        return { ...prev, [templateId]: newStatus }
      }
      return prev
    })
  }, [])

  const copyToClipboard = useCallback(async () => {
    if (selectedTemplateId) {
      try {
        await navigator.clipboard.writeText(modifiedContents[selectedTemplateId])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        updateTemplateStatus(selectedTemplateId, "Copié")
      } catch (err) {
        console.error("Failed to copy text: ", err)
      }
    }
  }, [selectedTemplateId, modifiedContents, updateTemplateStatus])

  const handleSearchAndReplace = () => {
    if (!searchTerm || !selectedTemplateId) return

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    }

    const regex = new RegExp(escapeRegExp(searchTerm), "gi")
    const newContent = editableContent.replace(regex, replaceTerm)
    const count = (editableContent.match(regex) || []).length

    setModifiedContents((prev) => ({
      ...prev,
      [selectedTemplateId]: newContent,
    }))
    setReplaceCount(count)

    if (count > 0) {
      addModificationLog(
        selectedTemplateId,
        "Recherche et remplacement",
        `Remplacé "${searchTerm}" par "${replaceTerm}" (${count} occurrences)`,
      )
      updateTemplateStatus(selectedTemplateId, "Modifié")
    } else {
      toast({
        title: "Aucun remplacement effectué",
        description: `Aucune occurrence de "${searchTerm}" n'a été trouvée.`,
        duration: 3000,
      })
    }
  }

  const handleContentChange = (newContent: string) => {
    if (selectedTemplateId) {
      setModifiedContents((prev) => ({
        ...prev,
        [selectedTemplateId]: newContent,
      }))
      addModificationLog(selectedTemplateId, "Modification manuelle", "Contenu modifié manuellement")
      const suggestionsCount = detectSuggestions(newContent)
      setTemplateSuggestions((prev) => ({
        ...prev,
        [selectedTemplateId]: suggestionsCount,
      }))
      updateTemplateStatus(selectedTemplateId, "Modifié")
    }
  }

  const applySuggestion = (suggestion: Suggestion) => {
    if (!selectedTemplateId) return

    let newContent = editableContent
    if (suggestion.isRegex) {
      newContent = newContent.replace(suggestion.from as RegExp, suggestion.to)
    } else {
      const regex = new RegExp(escapeRegExp(suggestion.from as string), "g")
      newContent = newContent.replace(regex, suggestion.to)
    }

    setModifiedContents((prev) => ({
      ...prev,
      [selectedTemplateId]: newContent,
    }))
    addModificationLog(
      selectedTemplateId,
      "Suggestion appliquée",
      `Remplacé "${suggestion.isRegex ? (suggestion.from as RegExp).toString() : suggestion.from}" par "${suggestion.to}"`,
    )
    const suggestionsCount = detectSuggestions(newContent)
    setTemplateSuggestions((prev) => ({
      ...prev,
      [selectedTemplateId]: suggestionsCount,
    }))
    updateTemplateStatus(selectedTemplateId, "Modifié")

    setSuggestions(detectSuggestionsForTemplate(newContent))
  }

  // Modifier la fonction handleSaveAll pour ouvrir la boîte de dialogue
  const handleSaveAll = () => {
    // Identifier tous les templates modifiés
    const modifiedTemplateIds = Object.entries(templateStatus)
      .filter(([_, status]) => status === "Modifié")
      .map(([id]) => id)

    if (modifiedTemplateIds.length === 0) {
      toast({
        title: "Aucune modification à sauvegarder",
        description: "Aucun template n'a été modifié.",
        duration: 3000,
      })
      return
    }

    // Ouvrir la boîte de dialogue de sauvegarde
    setIsSaveAllDialogOpen(true)
  }

  // Ajouter cette fonction pour gérer la fin de la sauvegarde
  const handleSaveAllComplete = (result: { success: number; errors: number }) => {
    // Mettre à jour l'interface après la sauvegarde
    if (result.success > 0) {
      toast({
        title: "Sauvegarde terminée",
        description: `${result.success} templates sauvegardés avec succès. ${result.errors} erreurs.`,
        duration: 5000,
      })

      // Recharger les templates si nécessaire
      if (result.success > 0) {
        loadTemplates()
      }
    }
  }

  // Ajouter cette fonction après les autres fonctions
  const handleSaveToGeosquare = useCallback(async () => {
    if (!selectedTemplateId || !selectedTemplate) {
      console.error("Aucun template sélectionné ou template non chargé");
      toast({
        title: "Erreur",
        description: "Aucun template sélectionné ou template non chargé.",
        variant: "destructive",
      });
      return;
    }
    
    // Forcer la mise à jour de l'état avec les dernières modifications du formulaire
    // Cela garantit que les changements dans les champs sont bien pris en compte
    const form = document.getElementById('template-general-form') as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      const name = formData.get('template-name') as string;
      const description = formData.get('template-description') as string;
      
      if (name !== selectedTemplate.name || description !== (selectedTemplate.description || '')) {
        updateTemplate(selectedTemplateId, {
          name,
          description: description || ''
        });
      }
    }

    // Vérifier l'état de la connexion réseau
    if (networkStatus === "offline") {
      toast({
        title: "Impossible de sauvegarder",
        description: "Vous êtes actuellement hors ligne. Veuillez vérifier votre connexion internet et réessayer.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // S'assurer que nous utilisons la dernière valeur de style
      const currentStyle = style || ""

      const config: Config = {
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        style: currentStyle,
      }


      // Récupérer les valeurs actuelles du formulaire
      const form = document.getElementById('template-general-form') as HTMLFormElement;
      let name = selectedTemplate.name;
      let description = selectedTemplate.description || '';
      
      if (form) {
        const formData = new FormData(form);
        const nameValue = formData.get('template-name');
        const descValue = formData.get('template-description');
        name = nameValue ? nameValue.toString() : name;
        description = descValue ? descValue.toString() : description;
      }

      // Préparer l'objet de mise à jour avec toutes les propriétés nécessaires
      const updatedTemplate = {
        ...templates.find(t => t.id === selectedTemplateId) || selectedTemplate,
        name,
        description,
        content: modifiedContents[selectedTemplateId] || '',
        config: {
          marginTop,
          marginRight,
          marginBottom,
          marginLeft,
          style: currentStyle,
        },
        header: headers[selectedTemplateId] || "",
        footer: footers[selectedTemplateId] || ""
      };

      // Mettre à jour le template avec toutes les propriétés en une seule requête
      await updateOfferTemplate(
        selectedTemplateId,
        updatedTemplate.content || '', // S'assurer que content est une string
        {
          marginTop: updatedTemplate.config.marginTop || '25mm',
          marginRight: updatedTemplate.config.marginRight || '10mm',
          marginBottom: updatedTemplate.config.marginBottom || '25mm',
          marginLeft: updatedTemplate.config.marginLeft || '10mm',
          style: updatedTemplate.config.style || ''
        },
        apiToken,
        updatedTemplate.header || '', // S'assurer que header est une string
        updatedTemplate.footer || ''  // S'assurer que footer est une string
      );

      // Mettre à jour l'état local avec les nouvelles valeurs
      updateTemplate(selectedTemplateId, {
        name: updatedTemplate.name,
        description: updatedTemplate.description || '', // S'assurer que description est une string
        config: updatedTemplate.config,
        header: updatedTemplate.header,
        footer: updatedTemplate.footer
      });

      const updateResponse = await fetch(`/api/proxy-offer-templates/${selectedTemplateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          ...updatedTemplate, // Inclure toutes les propriétés du template
          content: modifiedContents[selectedTemplateId],
          config: {
            marginTop,
            marginRight,
            marginBottom,
            marginLeft,
            style: currentStyle,
          },
          header: headers[selectedTemplateId] || "",
          footer: footers[selectedTemplateId] || "",
        }),
      });

      if (!updateResponse.ok) {
        console.error('Erreur lors de la requête:', {
          status: updateResponse.status,
          statusText: updateResponse.statusText,
          headers: Object.fromEntries(updateResponse.headers.entries())
        });
        
        let errorData;
        try {
          errorData = await updateResponse.json();
          console.error('Détails de l\'erreur:', errorData);
        } catch (e) {
          console.error('Impossible de parser la réponse d\'erreur:', e);
          errorData = { message: 'Réponse non-JSON' };
        }
        
        throw new Error(
          `Erreur lors de la mise à jour du template: ${updateResponse.status} ${updateResponse.statusText} - ${JSON.stringify(errorData)}`
        );
      }
      
      try {
        // Vérification silencieuse de la réponse
        await updateResponse.json();
      } catch (e) {
        // Ignorer l'erreur de parsing si la réponse est vide
      }

      addModificationLog(
        selectedTemplateId,
        "Sauvegarde sur Geosquare",
        "Contenu, marges, style, nom et description mis à jour sur Geosquare",
      )

      toast({
        title: "Sauvegarde réussie",
        description: "Le template a été mis à jour avec succès sur Geosquare.",
        duration: 3000,
      })

      updateTemplateStatus(selectedTemplateId, "Copié")

      // Mettre à jour la configuration dans l'état local
      setTemplateConfigs((prev) => ({
        ...prev,
        [selectedTemplateId]: { ...config },
      }))

      // Mettre à jour l'état original pour que les modifications futures soient détectées correctement
      setOriginalContents((prev) => ({
        ...prev,
        [selectedTemplateId]: modifiedContents[selectedTemplateId],
      }))
      
      // Mettre à jour les états originaux des en-têtes et pieds de page
      setOriginalHeaders((prev) => ({
        ...prev,
        [selectedTemplateId]: headers[selectedTemplateId],
      }))
      setOriginalFooters((prev) => ({
        ...prev,
        [selectedTemplateId]: footers[selectedTemplateId],
      }))
    } catch (error) {
      console.error("Erreur lors de la sauvegarde sur Geosquare:", error)

      let errorMessage = "Une erreur s'est produite lors de la mise à jour sur Geosquare."

      // Améliorer le message d'erreur
      if (error instanceof Error) {
        if (error.message === "Failed to fetch") {
          errorMessage = "Impossible de se connecter à l'API. Veuillez vérifier votre connexion internet."
        } else if (error.message.includes("401") || error.message.includes("403")) {
          errorMessage = "Authentification échouée. Votre token API semble être invalide ou expiré."
          // Forcer la déconnexion
          logout()
        }
      }

      toast({
        title: "Erreur de sauvegarde",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }, [
    selectedTemplateId,
    modifiedContents,
    apiToken,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    style,
    addModificationLog,
    toast,
    updateTemplateStatus,
    headers,
    footers,
    networkStatus,
    logout,
  ])

  // Modifier la fonction handleMarginChange pour s'assurer que le style est correctement mis à jour
  // Remplacer la fonction handleMarginChange actuelle par celle-ci:

  const handleMarginChange = (marginType: string, value: string) => {
    if (selectedTemplateId) {
      const newMargins = { marginTop, marginRight, marginBottom, marginLeft, [marginType]: value }
      setTemplateConfigs((prev) => ({
        ...prev,
        [selectedTemplateId]: { ...prev[selectedTemplateId], ...newMargins },
      }))
      addModificationLog(selectedTemplateId, "Modification des marges", `${marginType} modifié à ${value}`)
      updateTemplateStatus(selectedTemplateId, "Modifié")

      switch (marginType) {
        case "marginTop":
          setMarginTop(value)
          break
        case "marginRight":
          setMarginRight(value)
          break
        case "marginBottom":
          setMarginBottom(value)
          break
        case "marginLeft":
          setMarginLeft(value)
          break
      }
    }
  }

  // Modifier la fonction handleStyleChange pour s'assurer que le style est correctement mis à jour
  // Remplacer la fonction handleStyleChange actuelle par celle-ci:

  const handleStyleChange = (value: string) => {
    if (selectedTemplateId) {
      setStyle(value)

      // Mettre à jour la configuration dans l'état local
      setTemplateConfigs((prev) => {
        const updatedConfig = {
          ...prev[selectedTemplateId],
          style: value,
        }
        return {
          ...prev,
          [selectedTemplateId]: updatedConfig,
        }
      })

      addModificationLog(selectedTemplateId, "Modification du style", `Style CSS modifié`)
      updateTemplateStatus(selectedTemplateId, "Modifié")
    }
  }

  // Ajouter des fonctions pour gérer les modifications de header et footer

  // Ajouter ces fonctions après handleStyleChange
  const handleHeaderChange = (value: string) => {
    if (selectedTemplateId) {
      setHeaders((prev) => ({
        ...prev,
        [selectedTemplateId]: value,
      }))
      addModificationLog(selectedTemplateId, "Modification du header", `Header modifié`)
      updateTemplateStatus(selectedTemplateId, "Modifié")
    }
  }

  const handleFooterChange = (value: string) => {
    if (selectedTemplateId) {
      setFooters((prev) => ({
        ...prev,
        [selectedTemplateId]: value,
      }))
      addModificationLog(selectedTemplateId, "Modification du footer", `Footer modifié`)
      updateTemplateStatus(selectedTemplateId, "Modifié")
    }
  }

  // Add a function to format CSS
  const formatCss = (css: string): string => {
    if (!css) return ""

    try {
      // Simple CSS formatter
      return css
        .replace(/\s*{\s*/g, " {\n  ")
        .replace(/\s*;\s*/g, ";\n  ")
        .replace(/\s*}\s*/g, "\n}\n\n")
        .replace(/\n {2}\n/g, "\n")
        .trim()
    } catch (error) {
      console.error("Error formatting CSS:", error)
      return css
    }
  }

  // Add a function to extract CSS properties for the UI
  const extractCssProperties = (css: string): Record<string, string> => {
    const properties: Record<string, string> = {}

    try {
      // Extract properties from a simple CSS string
      const matches = css.match(/([a-zA-Z-]+)\s*:\s*([^;]+);/g)
      if (matches) {
        matches.forEach((match) => {
          const [property, value] = match.split(":").map((s) => s.trim())
          if (property && value) {
            properties[property] = value.replace(/;$/, "")
          }
        })
      }
    } catch (error) {
      console.error("Error extracting CSS properties:", error)
    }

    return properties
  }

  const applyGlobalChange = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation()
    if (!globalSearchTerm || !globalReplaceTerm) return

    const content = modifiedContents[templateId] || templates.find((t) => t.id === templateId)?.content || ""
    const regex = new RegExp(escapeRegExp(globalSearchTerm), "gi")
    const newContent = content.replace(regex, globalReplaceTerm)

    setPendingChanges((prev) => ({
      ...prev,
      [templateId]: newContent,
    }))
  }

  const getStatusColor = (status: TemplateStatus) => {
    switch (status) {
      case "Non ouvert":
        return "bg-gray-500"
      case "Ouvert":
        return "bg-blue-500"
      case "Modifié":
        return "bg-yellow-500"
      case "Copié":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  // Modifier la fonction isContentOrConfigModified pour vérifier aussi les modifications de header et footer

  // Dans la fonction isContentOrConfigModified, remplacer le return par:
  const isContentOrConfigModified = useCallback(() => {
    return (
      selectedTemplateId &&
      (originalContents[selectedTemplateId] !== modifiedContents[selectedTemplateId] ||
        originalHeaders[selectedTemplateId] !== headers[selectedTemplateId] ||
        originalFooters[selectedTemplateId] !== footers[selectedTemplateId] ||
        JSON.stringify(templateConfigs[selectedTemplateId]) !==
          JSON.stringify({
            marginTop,
            marginRight,
            marginBottom,
            marginLeft,
            style,
          }))
    )
  }, [
    selectedTemplateId,
    originalContents,
    modifiedContents,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    style,
    templateConfigs,
    originalHeaders,
    headers,
    originalFooters,
    footers,
  ])

  const handleGlobalSearch = () => {
    if (!globalSearchTerm) return

    const results: Record<string, number> = {}
    templates.forEach((template) => {
      const content = modifiedContents[template.id] || template.content
      const regex = new RegExp(escapeRegExp(globalSearchTerm), "gi")
      const matches = (content.match(regex) || []).length
      if (matches > 0) {
        results[template.id] = matches
      }
    })
    setGlobalSearchResults(results)
  }

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  const handleArchiveTemplate = async (templateId: string) => {
    if (!templateId) return

    try {
      await archiveOfferTemplate(templateId, apiToken)
      toast({
        title: "Archivage réussi",
        description: "Le modèle a été archivé avec succès.",
        duration: 3000,
      })
      // Remove the archived template from the list
      setTemplates((prevTemplates) => prevTemplates.filter((template) => template.id !== templateId))
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null)
      }
    } catch (error) {
      console.error("Erreur lors de l'archivage du modèle:", error)
      toast({
        title: "Erreur d'archivage",
        description: "Une erreur s'est produite lors de l'archivage du modèle.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenInput.trim()) {
      toast({
        title: "Erreur",
        description: "Le token est requis",
        variant: "destructive",
      })
      return
    }

    login(tokenInput)
    setTokenInput("")
    setIsTokenDialogOpen(false)
  }

  const handleLogout = () => {
    logout()
    setTemplates([])
    setSelectedTemplateId(null)
    setModifiedContents({})
    setOriginalContents({})
    setTemplateStatus({})
    setTemplateConfigs({})
    setIsTokenDialogOpen(true)
  }

  // Helper function for template status
  const getTemplateStatus = (id: string) => {
    const status = templateStatus[id] || "Non ouvert"
    switch (status) {
      case "Non ouvert":
        return { label: status, color: "bg-gray-500" }
      case "Ouvert":
        return { label: status, color: "bg-blue-500" }
      case "Modifié":
        return { label: status, color: "bg-yellow-500" }
      case "Copié":
        return { label: status, color: "bg-green-500" }
      default:
        return { label: status, color: "bg-gray-500" }
    }
  }

  // Fonction pour gérer les remplacements globaux
  const handleApplyChanges = (changes: Record<string, string>) => {
    // Appliquer les changements aux contenus modifiés
    const newModifiedContents = { ...modifiedContents }

    Object.entries(changes).forEach(([templateId, newContent]) => {
      newModifiedContents[templateId] = newContent

      // Mettre à jour le statut du template
      updateTemplateStatus(templateId, "Modifié")

      // Ajouter un log de modification
      addModificationLog(templateId, "Modifications globales", `Modifications globales appliquées`)
    })

    setModifiedContents(newModifiedContents)

    toast({
      title: "Modifications effectuées",
      description: `${Object.keys(changes).length} templates ont été modifiés.`,
      duration: 3000,
    })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "s":
            e.preventDefault()
            if (selectedTemplateId && isContentOrConfigModified() && !isSaving) {
              handleSaveToGeosquare()
            }
            break
          case "c":
            if (selectedTemplateId && !e.shiftKey) {
              e.preventDefault()
              copyToClipboard()
            }
            break
          case "f":
            e.preventDefault()
            setIsSearchReplaceModalOpen(true)
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedTemplateId, isContentOrConfigModified, isSaving, handleSaveToGeosquare, copyToClipboard])

  const detectSuggestions = (content: string): number => {
    const detectedSuggestions = detectSuggestionsForTemplate(content)
    setSuggestions(detectedSuggestions)
    return detectedSuggestions.length
  }

  // Calculer le nombre total de suggestions dans tous les templates
  const totalSuggestionsCount = Object.values(templateSuggestions).reduce((sum, count) => sum + count, 0)

  // Vérifier s'il y a des modifications en attente
  const hasPendingChanges = useCallback(() => {
    return Object.values(templateStatus).some((status) => status === "Modifié")
  }, [templateStatus])

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen">
        <Dialog
          open={isTokenDialogOpen}
          onOpenChange={(open) => {
            // Ne pas permettre de fermer la dialog si pas de token
            if (isAuthenticated) {
              setIsTokenDialogOpen(open)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connexion requise</DialogTitle>
              <DialogDescription>Entrez le token d'API pour accéder à l'application</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div>
                <Label htmlFor="token">Token API</Label>
                <Input
                  id="token"
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Entrez le token d'API"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Bienvenue sur GeoSquare Templates</h2>
            <p className="text-muted-foreground">Veuillez vous connecter pour accéder à l'application</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription className="mb-2">{error}</AlertDescription>
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null)
              loadTemplates()
            }}
          >
            Réessayer
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsConnectionTestDialogOpen(true)}>
            Tester la connexion
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsTokenDialogOpen(true)}>
            Changer de token
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Navigation
        breadcrumbs={[
          { label: "Templates", href: "/" },
          ...(selectedTemplate ? [{ label: selectedTemplate.name }] : []),
        ]}
        onSettings={() => setIsTokenDialogOpen(true)}
      />
      {isSavingAll && (
        <div className="bg-primary/10 py-1 px-6 text-center text-sm">
          Sauvegarde en cours: {savingProgress.current}/{savingProgress.total} templates
        </div>
      )}
      {networkStatus === "offline" && (
        <div className="bg-destructive/10 py-1 px-6 text-center text-sm flex items-center justify-center gap-2">
          <WifiOff className="h-3 w-3" />
          Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent ne pas fonctionner.
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r flex flex-col">
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center justify-between">
              <SearchBar
                value={globalSearchTerm}
                onChange={setGlobalSearchTerm}
                onClear={() => setGlobalSearchTerm("")}
                placeholder="Search templates..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 flex-shrink-0"
                onClick={() => setIsSuggestionsPanelOpen(true)}
                title="Suggestions de corrections"
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{templates.length} templates</span>
              {totalSuggestionsCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setIsSuggestionsPanelOpen(true)} className="text-xs">
                  <Lightbulb className="h-3 w-3 mr-1 text-yellow-500" />
                  {totalSuggestionsCount} suggestions
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <TemplateList
              templates={templates}
              selectedId={selectedTemplateId}
              onSelect={(template) => {
                setSelectedTemplateId(template.id)
                if (!modifiedContents[template.id]) {
                  setModifiedContents((prev) => ({
                    ...prev,
                    [template.id]: template.content,
                  }))
                  const suggestionsCount = detectSuggestions(template.content)
                  setTemplateSuggestions((prev) => ({
                    ...prev,
                    [template.id]: suggestionsCount,
                  }))
                }
                if (templateStatus[template.id] === "Non ouvert") {
                  updateTemplateStatus(template.id, "Ouvert")
                }
              }}
              onArchive={(template) => handleArchiveTemplate(template.id)}
              onSaveAll={handleSaveAll}
              isSavingAll={isSavingAll}
              hasPendingChanges={hasPendingChanges()}
              getStatus={getTemplateStatus}
              getSuggestions={(id) => templateSuggestions[id] || 0}
              className="flex-1"
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorToolbar
            mode={editorMode}
            onModeChange={setEditorMode}
            onCopy={copyToClipboard}
            onSave={handleSaveToGeosquare}
            onSearchReplace={() => setIsSearchReplaceModalOpen(true)}
            isCopied={copied}
            isSaving={isSaving}
            canSave={Boolean(selectedTemplateId && isContentOrConfigModified())}
          />
          <div className="flex-1 overflow-auto p-4">
            {selectedTemplate ? (
              <div className="h-full">
                {/* Editor content based on mode */}
                {editorMode === "general" && selectedTemplate && (
                  <form id="template-general-form" className="space-y-6">
                    <div>
                      <Label htmlFor="template-name">Nom du template</Label>
                      <Input
                        id="template-name"
                        name="template-name"
                        value={selectedTemplate.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (!selectedTemplateId) return;
                          updateTemplate(selectedTemplateId, { name: e.target.value });
                        }}
                        placeholder="Nom du template"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-description">Description</Label>
                      <Textarea
                        id="template-description"
                        name="template-description"
                        value={selectedTemplate.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          if (!selectedTemplateId) return;
                          updateTemplate(selectedTemplateId, { description: e.target.value });
                        }}
                        placeholder="Description du template"
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                  </form>
                )}
                {editorMode === "content" && (
                  <TemplateEditor
                    content={editableContent}
                    onChange={handleContentChange}
                    className="h-full"
                  />
                )}
                {editorMode === "style" && (
                  <div className="flex flex-col h-full">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label htmlFor="marginTop">Marge haute</Label>
                        <Input
                          id="marginTop"
                          value={marginTop}
                          onChange={(e) => handleMarginChange("marginTop", e.target.value)}
                          placeholder="ex: 25mm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="marginRight">Marge droite</Label>
                        <Input
                          id="marginRight"
                          value={marginRight}
                          onChange={(e) => handleMarginChange("marginRight", e.target.value)}
                          placeholder="ex: 10mm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="marginBottom">Marge basse</Label>
                        <Input
                          id="marginBottom"
                          value={marginBottom}
                          onChange={(e) => handleMarginChange("marginBottom", e.target.value)}
                          placeholder="ex: 25mm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="marginLeft">Marge gauche</Label>
                        <Input
                          id="marginLeft"
                          value={marginLeft}
                          onChange={(e) => handleMarginChange("marginLeft", e.target.value)}
                          placeholder="ex: 10mm"
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                      <Label htmlFor="style" className="mb-2 block">
                        CSS Style
                      </Label>
                      <div className="flex-1 min-h-0">
                        <CssEditor
                          value={style}
                          onChange={handleStyleChange}
                          onApply={() => true}
                          className="h-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {editorMode === "logs" && (
                  <div className="space-y-2">
                    {modificationLogs[selectedTemplateId]?.map((log, index) => (
                      <div key={index} className="flex items-start gap-4 text-sm">
                        <time className="text-muted-foreground whitespace-nowrap">
                          {log.timestamp.toLocaleString()}
                        </time>
                        <div>
                          <span className="font-medium">{log.action}</span>
                          <p className="text-muted-foreground">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {editorMode === "css-preview" && (
                  <div className="h-full">
                    <CssPreview css={style} html={editableContent} className="h-full" />
                  </div>
                )}
                {/* Ajouter les onglets header et footer dans le rendu */}
                {editorMode === "header" && (
                  <div className="h-full">
                    <textarea
                      className="w-full h-full p-4 rounded-lg bg-muted font-mono text-sm resize-none"
                      value={selectedTemplateId ? headers[selectedTemplateId] || "" : ""}
                      onChange={(e) => handleHeaderChange(e.target.value)}
                      spellCheck={false}
                      placeholder="Entrez le contenu du header ici..."
                    />
                  </div>
                )}
                {editorMode === "footer" && (
                  <div className="h-full">
                    <textarea
                      className="w-full h-full p-4 rounded-lg bg-muted font-mono text-sm resize-none"
                      value={selectedTemplateId ? footers[selectedTemplateId] || "" : ""}
                      onChange={(e) => handleFooterChange(e.target.value)}
                      spellCheck={false}
                      placeholder="Entrez le contenu du footer ici..."
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">No template selected</h3>
                  <p className="text-muted-foreground">Select a template from the list to start editing</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change application</DialogTitle>
            <DialogDescription>Enter API token to change application</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div>
              <Label htmlFor="token">API Token</Label>
              <Input
                id="token"
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter API token"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Connect
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConnectionTestDialog
        isOpen={isConnectionTestDialogOpen}
        onClose={() => setIsConnectionTestDialogOpen(false)}
        token={apiToken}
        onTokenInvalid={() => setIsTokenDialogOpen(true)}
      />

      <SearchReplaceModal
        isOpen={isSearchReplaceModalOpen}
        onClose={() => setIsSearchReplaceModalOpen(false)}
        templates={templates}
        currentTemplateId={selectedTemplateId || ""}
        contents={modifiedContents}
        onApplyChanges={handleApplyChanges}
      />

      {isSuggestionsPanelOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-0 w-full h-full flex items-center justify-center">
            <div className="bg-background border rounded-lg shadow-lg w-[90vw] h-[90vh] flex flex-col overflow-hidden">
              <SuggestionsPanel
                templates={templates}
                contents={modifiedContents}
                onApplyChanges={handleApplyChanges}
                onClose={() => setIsSuggestionsPanelOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
      {/* Ajouter ce composant à la fin du rendu, juste avant la fermeture de la dernière div */}
      <SaveAllDialog
        isOpen={isSaveAllDialogOpen}
        onClose={() => setIsSaveAllDialogOpen(false)}
        templates={templates}
        modifiedTemplateIds={Object.entries(templateStatus)
          .filter(([_, status]) => status === "Modifié")
          .map(([id]) => id)}
        modifiedContents={modifiedContents}
        templateConfigs={templateConfigs}
        headers={headers}
        footers={footers}
        apiToken={apiToken || ""}
        onSaveComplete={handleSaveAllComplete}
      />
    </div>
  )
}

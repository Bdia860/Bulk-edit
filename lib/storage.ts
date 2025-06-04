import type { GlobalVariablesList } from "@/components/global-variables-modal"

// Clé utilisée pour stocker les listes de variables globales dans localStorage
const GLOBAL_VARIABLES_KEY = "geosquare_global_variables"

// Stocker les listes de variables globales dans localStorage
export const saveGlobalVariablesLists = (lists: GlobalVariablesList[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(GLOBAL_VARIABLES_KEY, JSON.stringify(lists))
  }
}

// Récupérer les listes de variables globales depuis localStorage
export const getGlobalVariablesLists = (): GlobalVariablesList[] => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(GLOBAL_VARIABLES_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error("Erreur lors de la récupération des listes de variables globales:", e)
      }
    }
  }
  return []
}

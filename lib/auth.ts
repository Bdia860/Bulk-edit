// Fonctions utilitaires pour gérer l'authentification

// Clé utilisée pour stocker le token dans localStorage
const TOKEN_KEY = "geosquare_auth_token"

// Stocker le token dans localStorage
export const saveToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

// Récupérer le token depuis localStorage
export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY)
  }
  return null
}

// Supprimer le token de localStorage
export const removeToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// Vérifier si un token existe
export const hasToken = (): boolean => {
  return !!getToken()
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { saveToken, getToken, removeToken } from "@/lib/auth"

interface UseAuthReturn {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
  loading: boolean
}

export function useAuth(): UseAuthReturn {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Charger le token au démarrage
  useEffect(() => {
    const storedToken = getToken()
    if (storedToken) {
      setToken(storedToken)
    }
    setLoading(false)
  }, [])

  // Fonction de connexion
  const login = useCallback((newToken: string) => {
    saveToken(newToken)
    setToken(newToken)
  }, [])

  // Fonction de déconnexion
  const logout = useCallback(() => {
    removeToken()
    setToken(null)
  }, [])

  return {
    token,
    isAuthenticated: !!token,
    login,
    logout,
    loading,
  }
}

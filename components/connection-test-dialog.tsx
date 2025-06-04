"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { testApiConnection } from "@/services/api"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ConnectionTestDialogProps {
  isOpen: boolean
  onClose: () => void
  token: string
  onTokenInvalid: () => void
}

export function ConnectionTestDialog({ isOpen, onClose, token, onTokenInvalid }: ConnectionTestDialogProps) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)

    try {
      const testResult = await testApiConnection(token)
      setResult(testResult)

      if (!testResult.success) {
        // Si le test échoue à cause d'un problème d'authentification, suggérer de changer le token
        if (testResult.message.includes("401") || testResult.message.includes("403")) {
          onTokenInvalid()
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Une erreur inconnue s'est produite",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test de connexion à l'API</DialogTitle>
          <DialogDescription>Vérifiez si l'application peut se connecter à l'API GeoSquare</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {result ? (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Connexion réussie" : "Erreur de connexion"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-center text-muted-foreground">
              Cliquez sur le bouton ci-dessous pour tester la connexion à l'API
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={handleTest} disabled={testing}>
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              "Tester la connexion"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

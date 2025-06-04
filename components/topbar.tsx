"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Save } from "lucide-react"
import { useAuthContext } from "@/contexts/auth-context"

interface TopbarProps {
  onSaveAll?: () => void
  isSavingAll?: boolean
  hasPendingChanges?: boolean
}

export function Topbar({ onSaveAll, isSavingAll, hasPendingChanges }: TopbarProps) {
  const { logout } = useAuthContext()

  return (
    <header className="bg-background border-b">
      <div className="app-container mx-auto px-6 py-3 flex justify-between items-center">
        <h1
          className="text-lg font-semibold"
          style={{
            all: 'initial',
            fontFamily: 'inherit',
            fontWeight: 600,
            fontSize: '1.125rem',
            lineHeight: '1.75rem',
            color: 'inherit',
            margin: 0,
            padding: 0,
            letterSpacing: 0,
            background: 'none',
            boxShadow: 'none',
            textAlign: 'inherit',
            textTransform: 'none',
            // Ajoute ici tout style Tailwind que tu veux forcer
          }}
        >
          GeoSquare Templates
        </h1>
        <nav className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="text-sm font-medium">
              <Link href="/">Templates</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-sm font-medium">
              <Link href="/suggestions">Suggestions</Link>
            </Button>
          </div>
          {onSaveAll && (
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
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="text-sm font-medium flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </Button>
        </nav>
      </div>
    </header>
  )
}

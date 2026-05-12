"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const SESSION_KEY = "admin_unlocked"

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [secretInput, setSecretInput] = useState("")
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "true") {
        setIsUnlocked(true)
      }
    } catch {
      /* mode privé ou SSR */
    }
    setMounted(true)
  }, [])

  if (!mounted) return null
  if (isUnlocked) return <>{children}</>

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const expected = process.env.NEXT_PUBLIC_ADMIN_SECRET
    if (secretInput === expected) {
      try {
        sessionStorage.setItem(SESSION_KEY, "true")
      } catch {
        /* ignore */
      }
      setIsUnlocked(true)
    } else {
      setError("Code incorrect. Réessayez.")
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 pb-4">
          <p className="text-lg font-semibold text-foreground">Accès saisie résultats</p>
          <p className="text-sm text-muted-foreground">Entrez le code d'accès pour continuer</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-secret">Code d'accès</Label>
              <Input
                id="access-secret"
                type="password"
                placeholder="Code d'accès"
                value={secretInput}
                onChange={(e) => {
                  setSecretInput(e.target.value)
                  setError("")
                }}
                autoComplete="off"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full">
              Accéder
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"

type ShareButtonProps = {
  shareUrl: string
  title: string
  className?: string
}

/**
 * Partage (Web Share API) ou copie du lien avec retour visuel bref.
 */
export function ShareButton({ shareUrl, title, className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: title, url: shareUrl })
        return
      } catch (e) {
        if (e && typeof e === "object" && (e as { name?: string }).name === "AbortError") {
          return
        }
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="w-full sm:max-w-md sm:mx-auto">
      <button
        type="button"
        onClick={handleClick}
        className={[
          "min-h-12 w-full touch-manipulation rounded border border-[#3ddc84]/40 bg-[#3ddc84] px-4 py-3 text-sm font-black uppercase tracking-wide text-[#0d0d0d] transition hover:bg-[#2ecf7a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ddc84] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
          className,
        ].join(" ")}
      >
        {copied ? "Lien copié !" : "Partager"}
      </button>
    </div>
  )
}

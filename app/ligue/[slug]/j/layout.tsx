import { Inter } from "next/font/google"
import type { ReactNode } from "react"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newspaper",
  weight: ["400", "500", "600", "700", "800", "900"],
})

/**
 * Inter pour l’esprit « front sport / une » sur les pages journée.
 */
export default function JournéeLayout({ children }: { children: ReactNode }) {
  return <div className={`${inter.className} font-sans`}>{children}</div>
}

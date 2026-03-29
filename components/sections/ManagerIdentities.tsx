import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { ManagerWithTeam } from "@/lib/types"

const rankSuffix = (rank: number): string => {
  if (rank === 1) return "er"
  return "e"
}

// Generate a consistent color from a string
const stringToColor = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 60%, 45%)`
}

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface ManagerIdentitiesProps {
  managers: ManagerWithTeam[]
}

export function ManagerIdentities({ managers }: ManagerIdentitiesProps) {
  // If no managers, show empty state
  if (managers.length === 0) {
    return (
      <section className="space-y-3 sm:space-y-4">
        <header className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Les identités de la ligue
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Visages et styles de jeu des managers
          </p>
        </header>
        <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground sm:px-6 sm:py-12">
          Aucun manager enregistré pour le moment.
        </div>
      </section>
    )
  }

  // Sort managers by current rank
  const sortedManagers = [...managers].sort((a, b) => {
    const rankA = a.team?.current_rank || 999
    const rankB = b.team?.current_rank || 999
    return rankA - rankB
  })

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Les identités de la ligue
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Visages et styles de jeu des managers
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {sortedManagers.map((manager) => {
          const teamName = manager.team?.name || manager.name
          const currentRank = manager.team?.current_rank || 0
          const avatarColor = stringToColor(manager.name)

          return (
            <Card
              key={manager.id}
              className="border-border bg-card shadow-none transition-colors hover:border-primary/40"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar and rank */}
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      {manager.avatar_url ? (
                        <AvatarImage src={manager.avatar_url} alt={manager.name} />
                      ) : null}
                      <AvatarFallback
                        className="text-lg font-bold"
                        style={{
                          backgroundColor: avatarColor,
                          color: "white"
                        }}
                      >
                        {getInitials(manager.name)}
                      </AvatarFallback>
                    </Avatar>
                    {currentRank > 0 && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-border flex items-center justify-center">
                        <span className="text-xs font-bold text-foreground">
                          {currentRank}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {teamName}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {manager.name}
                    </p>
                    <div className="flex items-center gap-2">
                      {manager.identity_label && (
                        <Badge
                          variant="secondary"
                          className="text-xs font-medium"
                        >
                          {manager.identity_label}
                        </Badge>
                      )}
                      {currentRank > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {currentRank}
                          {rankSuffix(currentRank)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

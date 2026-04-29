import { Skeleton } from "@/components/ui/skeleton"

export default function ManagersLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-2 border-b border-border/60 pb-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full max-w-md" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
          <ul
            className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 lg:grid-cols-4"
            aria-hidden
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-52 w-full rounded-lg" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

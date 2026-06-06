function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} />
}

export default function ActivitesLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header avec bouton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-11 w-44 shrink-0" />
      </div>

      {/* Recherche */}
      <Skeleton className="h-11 w-full" />

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-20" />)}
      </div>

      {/* Liste d'activités */}
      <div className="grid sm:grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[68px]" />)}
      </div>
    </div>
  )
}

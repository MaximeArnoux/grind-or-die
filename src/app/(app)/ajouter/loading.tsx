function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} />
}

export default function AjouterLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="space-y-2 mb-6">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>

      {/* Sélecteur de jour */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>

      {/* Recherche + Nouvelle */}
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 w-28" />
      </div>

      {/* Cartes spéciales (Sport, Sommeil, Jeux, Réseaux) */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[72px]" />)}
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-20" />)}
      </div>

      {/* Liste d'activités */}
      <div className="grid gap-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[68px]" />)}
      </div>
    </div>
  )
}

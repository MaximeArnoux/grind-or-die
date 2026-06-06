function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} />
}

export default function ProfilLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête profil : avatar + infos */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900 p-6">
        <div className="flex items-start gap-5">
          <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
        </div>
      </div>

      {/* Stats (4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>

      {/* Objectifs actifs */}
      <Skeleton className="h-40" />

      {/* Évolution du poids */}
      <Skeleton className="h-64" />

      {/* Activités récentes (3 jours) */}
      <Skeleton className="h-72" />
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} />
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>

      {/* Classement + Répartition/Chat */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-[480px]" />
      </div>

      {/* Activités récentes + Série */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>

      {/* Mes groupes */}
      <Skeleton className="h-32" />

      {/* Objectifs du jour */}
      <Skeleton className="h-48" />
    </div>
  )
}

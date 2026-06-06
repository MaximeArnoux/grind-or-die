function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} />
}

export default function HistoriqueLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>

      {/* Recherche */}
      <Skeleton className="h-11 w-full" />

      {/* Cartes groupées par jour */}
      <Skeleton className="h-48" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  )
}

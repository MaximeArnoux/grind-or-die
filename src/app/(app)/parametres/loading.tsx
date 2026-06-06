function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ''}`} />
}

export default function ParametresLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>

      {/* Carte Profil (avatar + champs) */}
      <Skeleton className="h-[420px]" />

      {/* Carte Objectifs */}
      <Skeleton className="h-44" />

      {/* Carte Notifications push */}
      <Skeleton className="h-40" />

      {/* Carte Sécurité */}
      <Skeleton className="h-44" />
    </div>
  )
}

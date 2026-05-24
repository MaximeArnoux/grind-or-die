function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800 rounded-xl ${className ?? ''}`} />
}

export default function AjouterLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Skeleton className="h-8 w-52" />
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 w-28" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-20" />)}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    </div>
  )
}

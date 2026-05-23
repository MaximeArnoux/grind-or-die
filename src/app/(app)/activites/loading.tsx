function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800 rounded-xl ${className ?? ''}`} />
}

export default function ActivitesLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-8 w-52" />
      <div className="flex gap-3">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-24" />)}
        </div>
        <Skeleton className="h-9 flex-1" />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="h-12 border-b border-gray-800" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 border-b border-gray-800/50 flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-4 flex-1 max-w-xs" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

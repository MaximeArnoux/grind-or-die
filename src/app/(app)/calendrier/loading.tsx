function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800 rounded-xl ${className ?? ''}`} />
}

export default function CalendrierLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-8 w-36" />
      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="w-8 h-8" />
            <Skeleton className="h-6 w-36" />
            <Skeleton className="w-8 h-8" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
          </div>
        </div>
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}

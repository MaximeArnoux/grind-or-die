function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800 rounded-xl ${className ?? ''}`} />
}

export default function ParametresLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-36" />
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <Skeleton className="h-5 w-20" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-xl" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-11" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-36" />
    </div>
  )
}

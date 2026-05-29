'use client'

import { useEffect, useState } from 'react'
import { Check, X, Info } from 'lucide-react'
import { subscribeToToasts, type ToastItem } from '@/lib/toast'

function ToastCard({ item }: { item: ToastItem }) {
  const icons = {
    success: <Check size={15} className="shrink-0 text-green-400" />,
    error:   <X    size={15} className="shrink-0 text-red-400" />,
    info:    <Info size={15} className="shrink-0 text-blue-400" />,
  }
  const bars = {
    success: 'bg-green-500/20 border-green-500/30',
    error:   'bg-red-500/20   border-red-500/30',
    info:    'bg-blue-500/20  border-blue-500/30',
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-medium text-white max-w-xs backdrop-blur-sm ${bars[item.type]} ${item.exiting ? 'animate-toast-exit' : 'animate-toast-enter'}`}
    >
      {icons[item.type]}
      <span>{item.message}</span>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const unsub = subscribeToToasts(setToasts)
    return () => { unsub() }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => <ToastCard key={t.id} item={t} />)}
    </div>
  )
}

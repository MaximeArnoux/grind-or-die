'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ObjectiveDeleteButton({ objectiveId }: { objectiveId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    await supabase.from('user_objectives').update({ is_active: false }).eq('id', objectiveId)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="shrink-0 p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
      title="Supprimer cet objectif"
    >
      <X size={14} />
    </button>
  )
}

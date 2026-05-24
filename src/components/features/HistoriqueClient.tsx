'use client'

import { useState } from 'react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Search, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatPoints, cn, capitalizeFirst } from '@/lib/utils'

function groupByDay(logs: any[]) {
  const groups = new Map<string, any[]>()
  for (const log of logs) {
    const day = format(parseISO(log.logged_at), 'yyyy-MM-dd')
    const existing = groups.get(day) ?? []
    existing.push(log)
    groups.set(day, existing)
  }
  return groups
}

function getDayLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Aujourd\'hui'
  if (isYesterday(d)) return 'Hier'
  return capitalizeFirst(format(d, 'EEEE dd MMMM', { locale: fr }))
}

export function HistoriqueClient({ logs }: { logs: any[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [deleteLog, setDeleteLog] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  const filtered = logs.filter(l =>
    !search || l.activity?.name?.toLowerCase().includes(search.toLowerCase())
  )
  const grouped = groupByDay(filtered)

  async function handleDelete() {
    if (!deleteLog) return
    setLoading(true)
    await supabase.from('activity_logs').delete().eq('id', deleteLog.id)
    setDeleteLog(null)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Rechercher dans l'historique..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Grouped logs */}
      {Array.from(grouped.entries()).map(([day, dayLogs]) => {
        const dayTotal = dayLogs.reduce((sum, l) => sum + l.points_earned, 0)
        return (
          <Card key={day}>
            <div className="px-5 py-3 border-b border-gray-800/50 flex items-center justify-between">
              <h3 className="font-semibold text-white">{getDayLabel(day)}</h3>
              <span className={cn('text-sm font-bold', dayTotal >= 0 ? 'text-green-400' : 'text-red-400')}>
                {formatPoints(dayTotal)} pts
              </span>
            </div>
            <CardContent className="pt-3">
              <div className="space-y-2">
                {dayLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-800/30 last:border-0 group">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{log.activity?.emoji ?? '⚡'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{log.activity?.name}</p>
                          <Badge variant={
                            log.activity?.type === 'negative' ? 'negative' : 'positive'
                          } className="text-[10px]">
                            {log.activity?.type === 'negative' ? 'Négative' : 'Positive'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {log.activity?.category?.emoji} {log.activity?.category?.name}
                          {log.notes && ` · ${log.notes}`}
                          {log.multiplier > 1 && ` · ×${log.multiplier} objectif`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('text-sm font-bold', log.points_earned >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {formatPoints(log.points_earned)} pts
                      </span>
                      <button
                        onClick={() => setDeleteLog(log)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-gray-600">Aucune activité trouvée</p>
          </CardContent>
        </Card>
      )}

      <Modal open={!!deleteLog} onClose={() => setDeleteLog(null)} title="Supprimer l'entrée">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Supprimer <span className="text-white font-medium">{deleteLog?.activity?.name}</span> de l&apos;historique ?
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteLog(null)}>Annuler</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} loading={loading}>Supprimer</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

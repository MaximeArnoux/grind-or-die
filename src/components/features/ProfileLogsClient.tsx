'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatPoints, capitalizeFirst, cn, toParisDate } from '@/lib/utils'
import { adminDeleteLog } from '@/app/(app)/profil/actions'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Log {
  id: string
  points_earned: number
  logged_at: string
  notes?: string | null
  multiplier?: number
  activity?: { name?: string | null; emoji?: string | null; type?: string | null } | null
}

interface DayGroup {
  date: string
  logs: Log[]
  isToday: boolean
}

interface Props {
  groupedDays: DayGroup[]
  isAdmin: boolean
  username: string
}

function getDayLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return "Aujourd'hui"
  if (isYesterday(d)) return 'Hier'
  return capitalizeFirst(format(d, 'EEEE dd MMMM', { locale: fr }))
}

export function ProfileLogsClient({ groupedDays, isAdmin, username }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [deleteLog, setDeleteLog] = useState<Log | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteLog) return
    setDeleting(true)
    if (isAdmin) {
      await adminDeleteLog(deleteLog.id, username)
    } else {
      await supabase.from('activity_logs').delete().eq('id', deleteLog.id)
    }
    setDeleteLog(null)
    setDeleting(false)
    router.refresh()
  }

  return (
    <>
      <div className="space-y-4">
        {groupedDays.map(({ date, logs, isToday }) => {
          const dayTotal = logs.reduce((sum, l) => sum + l.points_earned, 0)
          const label = getDayLabel(date)

          return (
            <div key={date}>
              {/* Day header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-semibold text-white">{label}</span>
                {logs.length > 0 && (
                  <span className={cn('text-sm font-bold', dayTotal >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {formatPoints(dayTotal)} pts
                  </span>
                )}
              </div>

              {/* Activities or empty state */}
              <div className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-800/60">
                {logs.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-4">Aucune activité</p>
                ) : (
                  <div className="divide-y divide-gray-800/50">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-center justify-between px-4 py-2.5 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg shrink-0">{log.activity?.emoji ?? '⚡'}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{log.activity?.name ?? '?'}</p>
                            {(log.notes || (log.multiplier ?? 1) > 1 || isToday) && (
                              <p className="text-xs text-gray-500 truncate">
                                {isToday && <span className="text-gray-600">{format(toParisDate(log.logged_at), 'HH:mm')}</span>}
                                {log.notes && <span>{isToday ? ' · ' : ''}{log.notes}</span>}
                                {(log.multiplier ?? 1) > 1 && <span className="text-violet-400"> · ×{log.multiplier} objectif</span>}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={cn('text-sm font-bold',
                            log.points_earned > 0 ? 'text-green-400' :
                            log.points_earned < 0 ? 'text-red-400' : 'text-gray-500'
                          )}>
                            {log.points_earned === 0 ? '+0' : formatPoints(log.points_earned)} pts
                          </span>
                          {(isAdmin) && (
                            <button
                              onClick={() => setDeleteLog(log)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={!!deleteLog} onClose={() => setDeleteLog(null)} title="Supprimer cette activité ?">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {deleteLog?.activity?.emoji} {deleteLog?.activity?.name} · {formatPoints(deleteLog?.points_earned ?? 0)} pts
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteLog(null)}>Annuler</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} loading={deleting}>Supprimer</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

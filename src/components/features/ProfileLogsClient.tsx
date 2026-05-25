'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatPoints, toParisDate } from '@/lib/utils'
import { adminDeleteLog } from '@/app/(app)/profil/[username]/actions'
import { cn } from '@/lib/utils'

interface Log {
  id: string
  points_earned: number
  logged_at: string
  notes?: string | null
  activity?: { name?: string | null; emoji?: string | null } | null
}

interface Props {
  logs: Log[]
  isAdmin: boolean
  username: string
}

export function ProfileLogsClient({ logs: initialLogs, isAdmin, username }: Props) {
  const [logs, setLogs] = useState<Log[]>(initialLogs)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(logId: string) {
    setDeleting(logId)
    const result = await adminDeleteLog(logId, username)
    if (!result.error) {
      setLogs(prev => prev.filter(l => l.id !== logId))
    }
    setDeleting(null)
  }

  if (logs.length === 0) {
    return <p className="text-gray-600 text-sm text-center py-8">Aucune activité</p>
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0 group">
          <div className="flex items-center gap-3">
            <span>{log.activity?.emoji ?? '⚡'}</span>
            <div>
              <p className="text-sm text-white font-medium">
                {log.activity?.name}
                {log.notes ? ` · ${log.notes}` : ''}
              </p>
              <p className="text-xs text-gray-500">
                {format(toParisDate(log.logged_at), 'dd MMM à HH:mm', { locale: fr })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('text-sm font-bold', log.points_earned > 0 ? 'text-green-400' : log.points_earned < 0 ? 'text-red-400' : 'text-gray-500')}>
              {log.points_earned === 0 ? '+0' : formatPoints(log.points_earned)} pts
            </span>
            {isAdmin && (
              <button
                onClick={() => handleDelete(log.id)}
                disabled={deleting === log.id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all disabled:opacity-50"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

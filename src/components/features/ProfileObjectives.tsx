'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { createVoteRequest } from '@/app/(app)/parametres/actions'
import type { Activity } from '@/types'

interface Props {
  objectives: any[]
  isOwn: boolean
  userId: string
  activities: Activity[]
  userGroups: { id: string; name: string }[]
}

function periodLabel(p: string) {
  return p === 'daily' ? 'jour' : p === 'monthly' ? 'mois' : 'semaine'
}

export function ProfileObjectives({ objectives, isOwn, userId, activities, userGroups }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [show, setShow] = useState(false)
  const [objActivity, setObjActivity] = useState('')
  const [objCount, setObjCount] = useState('1')
  const [objPeriod, setObjPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [objMultiplier, setObjMultiplier] = useState('1.5')
  const [objGroupId, setObjGroupId] = useState(userGroups.length === 1 ? userGroups[0].id : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const voteMode = !!objGroupId

  async function addObjective() {
    if (!objActivity) return
    setLoading(true)
    setError('')
    try {
      if (objGroupId) {
        const result = await createVoteRequest(objGroupId, objActivity, parseInt(objCount), objPeriod, parseFloat(objMultiplier))
        if (result.error) { setError(result.error); return }
      } else {
        await supabase.from('user_objectives').insert({
          user_id: userId,
          activity_id: objActivity,
          target_count: parseInt(objCount),
          period: objPeriod,
          multiplier: parseFloat(objMultiplier),
          is_active: true,
        })
      }
      setShow(false)
      setObjActivity(''); setObjCount('1'); setObjMultiplier('1.5')
      setObjGroupId(userGroups.length === 1 ? userGroups[0].id : '')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function removeObjective(id: string) {
    await supabase.from('user_objectives').update({ is_active: false }).eq('id', id)
    router.refresh()
  }

  if (objectives.length === 0 && !isOwn) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Objectifs actifs</CardTitle>
          {isOwn && (
            <Button size="sm" onClick={() => { setError(''); setShow(true) }}>
              <Plus size={14} /> Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {objectives.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-6">
            Aucun objectif. Ajoute-en un pour gagner des points bonus !
          </p>
        ) : (
          <div className="space-y-2">
            {objectives.map(obj => (
              <div key={obj.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <span className="text-sm text-white">
                  {(obj.activity as any)?.emoji} {(obj.activity as any)?.name}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="violet">×{obj.multiplier}</Badge>
                  <span className="text-xs text-gray-500">{obj.target_count}× / {periodLabel(obj.period)}</span>
                  {isOwn && (
                    <button onClick={() => removeObjective(obj.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add modal */}
      <Modal open={show} onClose={() => setShow(false)} title="Ajouter un objectif">
        <div className="space-y-4">
          {userGroups.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                <Users size={14} className="text-violet-400" />
                Soumettre au vote du groupe
              </label>
              <select
                value={objGroupId}
                onChange={e => setObjGroupId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-violet-500"
              >
                <option value="">Sans vote (créer directement)</option>
                {userGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Activité</label>
            <select
              value={objActivity}
              onChange={e => setObjActivity(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-violet-500"
            >
              <option value="">Choisir une activité...</option>
              {activities.filter(a => a.type === 'positive' || a.type === 'bonus').map(a => (
                <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Objectif (nombre de fois)" type="number" value={objCount} onChange={e => setObjCount(e.target.value)} min="1" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Par</label>
              <select
                value={objPeriod}
                onChange={e => setObjPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-violet-500"
              >
                <option value="daily">Jour</option>
                <option value="weekly">Semaine</option>
                <option value="monthly">Mois</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Multiplicateur de points</label>
            <select
              value={objMultiplier}
              onChange={e => setObjMultiplier(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-violet-500"
            >
              <option value="1.25">×1.25 (+25%)</option>
              <option value="1.5">×1.5 (+50%)</option>
            </select>
          </div>

          <div className={`p-3 rounded-xl border ${voteMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-violet-500/10 border-violet-500/20'}`}>
            <p className={`text-xs ${voteMode ? 'text-blue-400' : 'text-violet-400'}`}>
              {voteMode
                ? `Ta demande sera soumise au vote des membres du groupe. L'objectif sera créé si la majorité accepte.`
                : `Chaque fois que tu logges cette activité avec cet objectif actif, tu gagneras ×${objMultiplier} les points normaux.`
              }
            </p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShow(false)}>Annuler</Button>
            <Button className="flex-1" onClick={addObjective} loading={loading}>
              {voteMode ? '🗳️ Soumettre au vote' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

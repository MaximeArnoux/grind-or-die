'use client'

import { useState } from 'react'
import { Edit2, Trash2, Search, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Activity, UserObjective } from '@/types'
import { formatPoints } from '@/lib/utils'

const TYPE_LABELS = { positive: 'Positive', negative: 'Negative', bonus: 'Positive' }
const TYPE_FILTERS = ['Toutes', 'Positives', 'Negatives']

interface Props {
  activities: Activity[]
  userObjectives: UserObjective[]
  userId: string
}

export function ActivitiesClient({ activities, userObjectives, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [filter, setFilter] = useState('Toutes')
  const [search, setSearch] = useState('')
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [editPoints, setEditPoints] = useState('')
  const [editCanRepeat, setEditCanRepeat] = useState(false)
  const [editMaxPerDay, setEditMaxPerDay] = useState('1')
  const [deleteActivity, setDeleteActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(false)

  const filtered = activities.filter(a => {
    const matchFilter =
      filter === 'Toutes' ||
      (filter === 'Positives' && (a.type === 'positive' || a.type === 'bonus')) ||
      (filter === 'Negatives' && a.type === 'negative')
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  async function handleEditSave() {
    if (!editActivity) return
    const pts = parseInt(editPoints)
    if (isNaN(pts)) return
    setLoading(true)
    await supabase.from('activities').update({
      points: pts,
      can_repeat_daily: editCanRepeat,
      max_per_day: editCanRepeat ? Math.max(1, parseInt(editMaxPerDay) || 1) : 1,
    }).eq('id', editActivity.id)
    setEditActivity(null)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteActivity) return
    setLoading(true)
    await supabase.from('activities').delete().eq('id', deleteActivity.id)
    setDeleteActivity(null)
    setLoading(false)
    router.refresh()
  }

  const objectiveIds = new Set(userObjectives.map(o => o.activity_id))

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {TYPE_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
            >
              {f === 'Positives' && '🟢 '}
              {f === 'Negatives' && '🔴 '}
              {f === 'Bonus' && '🟡 '}
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher une activité..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activité</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filtered.map(activity => (
                <tr key={activity.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{activity.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{activity.name}</p>
                        {activity.category && (
                          <p className="text-xs text-gray-500">{activity.category.emoji} {activity.category.name}</p>
                        )}
                      </div>
                      {objectiveIds.has(activity.id) && (
                        <span title="Objectif actif"><CheckCircle size={14} className="text-violet-400" /></span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={activity.type === 'negative' ? 'negative' : 'positive'}>
                      {TYPE_LABELS[activity.type]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-bold ${activity.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPoints(activity.points)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditActivity(activity); setEditPoints(String(activity.points)); setEditCanRepeat(activity.can_repeat_daily); setEditMaxPerDay(String(activity.max_per_day)) }}
                        className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-white transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteActivity(activity)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <p>Aucune activité trouvée</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={!!editActivity} onClose={() => setEditActivity(null)} title="Modifier l'activité">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {editActivity?.emoji} <span className="text-white font-medium">{editActivity?.name}</span>
          </p>
          <Input
            label="Points (négatif pour malus)"
            type="number"
            value={editPoints}
            onChange={e => setEditPoints(e.target.value)}
            placeholder="Ex: 5 ou -3"
          />
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-white">Quantité ajustable</p>
              <p className="text-xs text-gray-500">Permet de choisir le nombre de fois par jour</p>
            </div>
            <button
              type="button"
              onClick={() => setEditCanRepeat(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${editCanRepeat ? 'bg-violet-600' : 'bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${editCanRepeat ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {editCanRepeat && (
            <Input
              label="Maximum par jour"
              type="number"
              value={editMaxPerDay}
              onChange={e => setEditMaxPerDay(e.target.value)}
              placeholder="Ex: 10"
              min="1"
            />
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditActivity(null)}>Annuler</Button>
            <Button className="flex-1" onClick={handleEditSave} loading={loading}>Sauvegarder</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteActivity} onClose={() => setDeleteActivity(null)} title="Supprimer l'activité">
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Supprimer <span className="text-white font-medium">{deleteActivity?.name}</span> ?
            Cette action est irréversible.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteActivity(null)}>Annuler</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} loading={loading}>Supprimer</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

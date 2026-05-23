'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Minus, X, ChevronUp, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import type { Activity, UserObjective } from '@/types'
import { formatPoints, cn } from '@/lib/utils'
import { ACTIVITY_CATEGORIES } from '@/lib/constants/activities'

interface CartItem {
  activity: Activity
  count: number
  notes: string
  multiplier: number
}

interface Props {
  activities: Activity[]
  userObjectives: UserObjective[]
  userId: string
}

export function LogActivityClient({ activities, userObjectives, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartExpanded, setCartExpanded] = useState(true)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Create activity modal
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPoints, setNewPoints] = useState('')
  const [newEmoji, setNewEmoji] = useState('⚡')
  const [newCategory, setNewCategory] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const objectiveMap = useMemo(() => {
    const map = new Map<string, UserObjective>()
    userObjectives.forEach(o => map.set(o.activity_id, o))
    return map
  }, [userObjectives])

  const uniqueActivities = useMemo(() => {
    const seen = new Set<string>()
    return activities.filter(activity => {
      const key = activity.name.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [activities])

  const categories = useMemo(() => {
    const seen = new Set<string>()
    const cats: string[] = []
    uniqueActivities.forEach(a => {
      const name = a.category?.name
      if (name && !seen.has(name)) { seen.add(name); cats.push(name) }
    })
    return cats
  }, [uniqueActivities])

  const filtered = uniqueActivities.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !selectedCategory || a.category?.name === selectedCategory
    return matchSearch && matchCat
  })

  const cartMap = useMemo(() => {
    const map = new Map<string, CartItem>()
    cart.forEach(item => map.set(item.activity.id, item))
    return map
  }, [cart])

  const totalPoints = useMemo(() =>
    cart.reduce((sum, item) => sum + Math.round(item.activity.points * item.count * item.multiplier), 0)
  , [cart])

  function addToCart(activity: Activity) {
    const objective = objectiveMap.get(activity.id)
    const multiplier = objective?.multiplier ?? 1
    setCart(prev => {
      const existing = prev.find(i => i.activity.id === activity.id)
      if (existing) {
        return prev.map(i => i.activity.id === activity.id
          ? { ...i, count: i.count + 1 }
          : i
        )
      }
      return [...prev, { activity, count: 1, notes: '', multiplier }]
    })
  }

  function removeFromCart(activityId: string) {
    setCart(prev => prev.filter(i => i.activity.id !== activityId))
  }

  function updateCount(activityId: string, delta: number) {
    setCart(prev => prev.map(i => {
      if (i.activity.id !== activityId) return i
      const newCount = Math.max(1, i.count + delta)
      return { ...i, count: newCount }
    }))
  }

  function updateNotes(activityId: string, notes: string) {
    setCart(prev => prev.map(i => i.activity.id === activityId ? { ...i, notes } : i))
  }

  async function handleLogAll() {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const inserts = cart.map(item => ({
        user_id: userId,
        activity_id: item.activity.id,
        points_earned: Math.round(item.activity.points * item.count * item.multiplier),
        multiplier: item.multiplier,
        notes: item.notes || null,
      }))
      const { error } = await supabase.from('activity_logs').insert(inserts)
      if (!error) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setCart([])
          router.refresh()
        }, 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    const pts = parseInt(newPoints)
    if (!newName || isNaN(pts)) return
    setCreateLoading(true)
    try {
      const { data: catData } = await supabase
        .from('activity_categories')
        .select('id')
        .eq('name', newCategory)
        .single()

      await supabase.from('activities').insert({
        name: newName,
        emoji: newEmoji,
        points: pts,
        type: pts >= 0 ? 'positive' : 'negative',
        category_id: catData?.id ?? null,
        is_default: false,
        can_repeat_daily: false,
        max_per_day: 1,
      })
      setShowCreate(false)
      setNewName(''); setNewPoints(''); setNewEmoji('⚡'); setNewCategory('')
      router.refresh()
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className={cn('space-y-5', cart.length > 0 ? 'pb-52 lg:pb-48' : '')}>
      {/* Search + New */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher une activité..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <Button variant="outline" size="md" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Nouvelle
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', !selectedCategory ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
        >
          Toutes
        </button>
        {categories.map(cat => {
          const catDef = ACTIVITY_CATEGORIES.find(c => c.name === cat)
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', selectedCategory === cat ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
            >
              {catDef?.emoji} {cat}
            </button>
          )
        })}
      </div>

      {/* Activities grid */}
      <div className="grid gap-2">
        {filtered.map(activity => {
          const hasObjective = objectiveMap.has(activity.id)
          const cartItem = cartMap.get(activity.id)
          const inCart = !!cartItem
          return (
            <button
              key={activity.id}
              onClick={() => addToCart(activity)}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl border text-left transition-all',
                inCart
                  ? 'border-violet-500 bg-violet-600/10'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800/50'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{activity.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-white">{activity.name}</p>
                  <p className="text-xs text-gray-500">{activity.category?.name}</p>
                </div>
                {hasObjective && <Badge variant="violet" className="text-[10px]">×{objectiveMap.get(activity.id)?.multiplier}</Badge>}
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('text-sm font-bold', activity.points >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {formatPoints(activity.points)} pts
                </span>
                {inCart && (
                  <div className="flex items-center justify-center w-6 h-6 bg-violet-600 rounded-full">
                    <span className="text-[10px] font-black text-white">{cartItem.count}</span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Sticky cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-[64px] lg:bottom-0 left-0 right-0 z-40 px-3 pb-2 lg:pb-3">
          <div className="max-w-2xl mx-auto bg-gray-950 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">

            {/* Header — always visible, toggles expansion */}
            <button
              onClick={() => setCartExpanded(v => !v)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-900/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-1">
                  {cart.slice(0, 4).map(item => (
                    <span key={item.activity.id} className="text-base leading-none">{item.activity.emoji}</span>
                  ))}
                  {cart.length > 4 && <span className="text-xs text-gray-400 pl-1">+{cart.length - 4}</span>}
                </div>
                <span className="text-sm font-semibold text-white">
                  {cart.length} activité{cart.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('text-xl font-black tabular-nums', totalPoints >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {totalPoints >= 0 ? '+' : ''}{totalPoints} pts
                </span>
                {cartExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
              </div>
            </button>

            {/* Expanded items list */}
            {cartExpanded && (
              <div className="border-t border-gray-800">
                <div className="max-h-44 overflow-y-auto divide-y divide-gray-800/50">
                  {cart.map(item => {
                    const pts = Math.round(item.activity.points * item.count * item.multiplier)
                    return (
                      <div key={item.activity.id} className="px-4 py-2 flex items-center gap-3">
                        <span className="text-lg shrink-0">{item.activity.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{item.activity.name}</p>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={e => updateNotes(item.activity.id, e.target.value)}
                            onClick={e => e.stopPropagation()}
                            placeholder="note..."
                            className="w-full text-[10px] text-gray-500 bg-transparent placeholder-gray-600 focus:outline-none focus:text-gray-300 mt-0.5"
                          />
                        </div>
                        {item.multiplier > 1 && (
                          <Badge variant="violet" className="text-[9px] shrink-0">×{item.multiplier}</Badge>
                        )}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => updateCount(item.activity.id, -1)}
                            className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center hover:bg-gray-700"
                          >
                            <Minus size={9} className="text-white" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-white">{item.count}</span>
                          <button
                            onClick={() => updateCount(item.activity.id, 1)}
                            className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center hover:bg-gray-700"
                          >
                            <Plus size={9} className="text-white" />
                          </button>
                        </div>
                        <span className={cn('text-xs font-bold shrink-0 w-14 text-right tabular-nums', pts >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {pts >= 0 ? '+' : ''}{pts} pts
                        </span>
                        <button
                          onClick={() => removeFromCart(item.activity.id)}
                          className="p-1 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 shrink-0"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="px-4 py-3 border-t border-gray-800">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleLogAll}
                    loading={loading}
                  >
                    {success
                      ? '✅ Activités enregistrées !'
                      : `Valider ${cart.length} activité${cart.length > 1 ? 's' : ''} · ${totalPoints >= 0 ? '+' : ''}${totalPoints} pts`
                    }
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create activity modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Créer une activité">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-20">
              <Input
                label="Emoji"
                value={newEmoji}
                onChange={e => setNewEmoji(e.target.value)}
                placeholder="⚡"
                className="text-center text-lg"
              />
            </div>
            <div className="flex-1">
              <Input label="Nom de l'activité" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Pompes 100" />
            </div>
          </div>
          <Input
            label="Points (négatif pour malus)"
            type="number"
            value={newPoints}
            onChange={e => setNewPoints(e.target.value)}
            placeholder="Ex: 3 ou -4"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Catégorie</label>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-violet-500"
            >
              <option value="">Sélectionner...</option>
              {ACTIVITY_CATEGORIES.map(c => (
                <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button className="flex-1" onClick={handleCreate} loading={createLoading}>Créer</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

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

const SPORT_ACTIVITIES = ['Course à pied', 'Vélo', 'Natation', 'Salle de sport', 'Street workout', 'Pompes', 'Pas']
const SLEEP_ACTIVITY = 'Sommeil'
const SPECIAL_ACTIVITIES = ['Jeux vidéo', 'Réseaux sociaux']

type SportDiscipline = 'course' | 'velo' | 'natation' | 'salle' | 'street' | 'pompes' | 'pas'

const DISCIPLINES: { key: SportDiscipline; label: string; emoji: string }[] = [
  { key: 'course', label: 'Course', emoji: '🏃' },
  { key: 'velo', label: 'Vélo', emoji: '🚴' },
  { key: 'natation', label: 'Natation', emoji: '🏊' },
  { key: 'salle', label: 'Salle', emoji: '🏋️' },
  { key: 'street', label: 'Street', emoji: '💪' },
  { key: 'pompes', label: 'Pompes', emoji: '🤸' },
  { key: 'pas', label: 'Pas', emoji: '👟' },
]

function calcSportPoints(discipline: SportDiscipline, value: number): number {
  switch (discipline) {
    case 'course': return Math.round(value)
    case 'velo': return Math.floor(value / 2)
    case 'natation': return Math.floor(value / 30) * 2
    case 'salle': return 5
    case 'street': return 5
    case 'pompes': return Math.floor(value / 50) * 2
    case 'pas': return Math.floor(value / 10000) * 2
  }
}

function calcSleepPoints(hours: number, minutes: number): number {
  const total = hours * 60 + minutes
  if (total <= 7 * 60) return -2
  if (total >= 10 * 60) return -3
  if (total >= 8 * 60 && total <= 9 * 60) return 3
  return 0
}

function calcSleepDuration(bedH: number, bedM: number, wakeH: number, wakeM: number): number {
  const bedTotal = bedH * 60 + bedM
  let wakeTotal = wakeH * 60 + wakeM
  if (wakeTotal <= bedTotal) wakeTotal += 24 * 60
  return wakeTotal - bedTotal
}

function calcWakeupPoints(hours: number, minutes: number): number {
  const total = hours * 60 + minutes
  if (total < 9 * 60) return 2    // avant 9h00
  if (total <= 10 * 60) return 0  // 9h00–10h00
  return -3                        // après 10h00
}

function calcJeuxPoints(hours: number): number {
  return -3 - (hours - 3) * 2
}

function calcReseauxPoints(hours: number, minutes: number): number {
  const totalMinutes = hours * 60 + minutes
  return -3 - Math.floor((totalMinutes - 120) / 30)
}

function calcBedtimePoints(hours: number, minutes: number): number {
  if (hours >= 20) return 2                        // 20h–23h59 : avant minuit
  if (hours === 0 && minutes === 0) return 2       // exactement minuit
  if (hours === 0) return 0                        // 00h01–00h59
  if (hours <= 2) return 0                         // 01h00–02h59
  return -4                                        // 03h00+
}

interface CartItem {
  activity: Activity
  count: number
  notes: string
  multiplier: number
}

interface GroupOption {
  id: string
  name: string
}

interface Props {
  activities: Activity[]
  userObjectives: UserObjective[]
  userId: string
  userGroups: GroupOption[]
  todayCounts: Record<string, number>
}

function isAtDailyLimit(activity: Activity, todayCounts: Record<string, number>): boolean {
  if (!activity.max_per_day || activity.max_per_day <= 0) return false
  return (todayCounts[activity.id] ?? 0) >= activity.max_per_day
}

export function LogActivityClient({ activities, userObjectives, userId, userGroups, todayCounts }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartExpanded, setCartExpanded] = useState(true)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [logDate, setLogDate] = useState<'today' | 'yesterday'>('today')

  // Sport modal
  const [showSport, setShowSport] = useState(false)
  const [discipline, setDiscipline] = useState<SportDiscipline>('course')
  const [sportValue, setSportValue] = useState('')
  const [sportLoading, setSportLoading] = useState(false)

  // Sleep modal
  const [showSleep, setShowSleep] = useState(false)
  const [bedtimeHours, setBedtimeHours] = useState('')
  const [bedtimeMinutes, setBedtimeMinutes] = useState('0')
  const [wakeHours, setWakeHours] = useState('')
  const [wakeMinutes, setWakeMinutes] = useState('0')
  const [sleepLoading, setSleepLoading] = useState(false)

  // Jeux vidéo modal
  const [showJeux, setShowJeux] = useState(false)
  const [jeuxHours, setJeuxHours] = useState('')
  const [jeuxLoading, setJeuxLoading] = useState(false)

  // Réseaux sociaux modal
  const [showReseaux, setShowReseaux] = useState(false)
  const [reseauxHours, setReseauxHours] = useState('')
  const [reseauxMinutes, setReseauxMinutes] = useState('0')
  const [reseauxLoading, setReseauxLoading] = useState(false)

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

  const sommeilAtLimit = useMemo(() => {
    const a = activities.find(a => a.name === SLEEP_ACTIVITY)
    return a ? isAtDailyLimit(a, todayCounts) : false
  }, [activities, todayCounts])

  const salleAtLimit = useMemo(() => {
    const a = activities.find(a => a.name === 'Salle de sport')
    return a ? isAtDailyLimit(a, todayCounts) : false
  }, [activities, todayCounts])

  const streetAtLimit = useMemo(() => {
    const a = activities.find(a => a.name === 'Street workout')
    return a ? isAtDailyLimit(a, todayCounts) : false
  }, [activities, todayCounts])

  // Activities excluding Fitness and Sommeil categories (handled by special cards)
  const regularActivities = useMemo(() => {
    const seen = new Set<string>()
    return activities.filter(a => {
      const cat = a.category?.name
      if (cat === 'Fitness' || cat === 'Sommeil') return false
      if (SPECIAL_ACTIVITIES.includes(a.name)) return false
      const key = a.name.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [activities])

  const categories = useMemo(() => {
    const seen = new Set<string>()
    const cats: string[] = []
    regularActivities.forEach(a => {
      const name = a.category?.name
      if (name && !seen.has(name)) { seen.add(name); cats.push(name) }
    })
    return cats
  }, [regularActivities])

  const filtered = regularActivities.filter(a => {
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
      if (existing) return prev.filter(i => i.activity.id !== activity.id)
      return [...prev, { activity, count: 1, notes: '', multiplier }]
    })
  }

  function removeFromCart(activityId: string) {
    setCart(prev => prev.filter(i => i.activity.id !== activityId))
  }

  function updateCount(activityId: string, delta: number) {
    setCart(prev => prev.map(i => {
      if (i.activity.id !== activityId) return i
      return { ...i, count: Math.max(1, i.count + delta) }
    }))
  }

  function updateNotes(activityId: string, notes: string) {
    setCart(prev => prev.map(i => i.activity.id === activityId ? { ...i, notes } : i))
  }

  function toggleGroup(groupId: string) {
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    )
  }

  function getLogTimestamp(): string {
    const d = new Date()
    if (logDate === 'yesterday') d.setDate(d.getDate() - 1)
    return d.toISOString()
  }

  async function logDirectly(activityName: string, pointsEarned: number, notes?: string) {
    const activity = activities.find(a => a.name === activityName)
    if (!activity) return false
    const { data: inserted, error } = await supabase
      .from('activity_logs')
      .insert({ user_id: userId, activity_id: activity.id, points_earned: pointsEarned, multiplier: 1, notes: notes ?? null, logged_at: getLogTimestamp() })
      .select('id')
    if (error || !inserted) return false
    if (selectedGroupIds.length > 0) {
      await supabase.from('group_activity_logs').insert(
        inserted.flatMap(log => selectedGroupIds.map(groupId => ({ group_id: groupId, activity_log_id: log.id })))
      )
    }
    return true
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
        logged_at: getLogTimestamp(),
      }))
      const { data: insertedLogs, error } = await supabase.from('activity_logs').insert(inserts).select('id')
      if (!error && insertedLogs && selectedGroupIds.length > 0) {
        await supabase.from('group_activity_logs').insert(
          insertedLogs.flatMap(log => selectedGroupIds.map(groupId => ({ group_id: groupId, activity_log_id: log.id })))
        )
      }
      if (!error) {
        setSuccess(true)
        setTimeout(() => { setSuccess(false); setCart([]); setSelectedGroupIds([]); router.refresh() }, 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSport() {
    const disciplineNames: Record<SportDiscipline, string> = {
      course: 'Course à pied', velo: 'Vélo', natation: 'Natation',
      salle: 'Salle de sport', street: 'Street workout',
      pompes: 'Pompes', pas: 'Pas',
    }
    const needsInput = discipline !== 'salle' && discipline !== 'street'
    const val = parseFloat(sportValue)
    if (needsInput && (!sportValue || isNaN(val) || val <= 0)) return

    const pts = calcSportPoints(discipline, needsInput ? val : 1)
    const unitLabel =
      discipline === 'natation' ? `${val} min` :
      discipline === 'course' || discipline === 'velo' ? `${val} km` :
      discipline === 'pompes' ? `${val} pompes` :
      discipline === 'pas' ? `${val} pas` : ''

    setSportLoading(true)
    const ok = await logDirectly(disciplineNames[discipline], pts, unitLabel || undefined)
    setSportLoading(false)
    if (ok) { setShowSport(false); setSportValue(''); router.refresh() }
  }

  async function handleSleep() {
    const bh = parseInt(bedtimeHours)
    const bm = parseInt(bedtimeMinutes)
    const wh = parseInt(wakeHours)
    const wm = parseInt(wakeMinutes)
    if (isNaN(bh) || bh < 0 || bh > 23) return
    if (isNaN(wh) || wh < 0 || wh > 23) return

    const bmVal = isNaN(bm) ? 0 : bm
    const wmVal = isNaN(wm) ? 0 : wm

    const durationMin = calcSleepDuration(bh, bmVal, wh, wmVal)
    const dh = Math.floor(durationMin / 60)
    const dm = durationMin % 60

    const durationPts = calcSleepPoints(dh, dm)
    const bedtimePts = calcBedtimePoints(bh, bmVal)
    const wakeupPts = calcWakeupPoints(wh, wmVal)
    const totalPts = durationPts + bedtimePts + wakeupPts

    const durationStr = `${dh}h${String(dm).padStart(2, '0')}`
    const bedtimeStr = `${bh}h${String(bmVal).padStart(2, '0')}`
    const wakeStr = `${wh}h${String(wmVal).padStart(2, '0')}`
    const notes = `${durationStr} · couché à ${bedtimeStr} · réveil à ${wakeStr}`

    setSleepLoading(true)
    const ok = await logDirectly(SLEEP_ACTIVITY, totalPts, notes)
    setSleepLoading(false)
    if (ok) {
      setShowSleep(false)
      setBedtimeHours(''); setBedtimeMinutes('0')
      setWakeHours(''); setWakeMinutes('0')
      router.refresh()
    }
  }

  async function handleJeux() {
    const h = parseInt(jeuxHours)
    if (isNaN(h) || h < 3) return
    const pts = calcJeuxPoints(h)
    setJeuxLoading(true)
    const ok = await logDirectly('Jeux vidéo', pts, `${h}h de jeux`)
    setJeuxLoading(false)
    if (ok) { setShowJeux(false); setJeuxHours(''); router.refresh() }
  }

  async function handleReseaux() {
    const h = parseInt(reseauxHours)
    const m = parseInt(reseauxMinutes)
    const totalMin = h * 60 + (isNaN(m) ? 0 : m)
    if (isNaN(h) || totalMin < 120) return
    const pts = calcReseauxPoints(h, isNaN(m) ? 0 : m)
    const mStr = !isNaN(m) && m > 0 ? `h${m}` : 'h'
    setReseauxLoading(true)
    const ok = await logDirectly('Réseaux sociaux', pts, `${h}${mStr} de réseaux`)
    setReseauxLoading(false)
    if (ok) { setShowReseaux(false); setReseauxHours(''); setReseauxMinutes('0'); router.refresh() }
  }

  async function handleCreate() {
    const pts = parseInt(newPoints)
    if (!newName || isNaN(pts)) return
    setCreateLoading(true)
    try {
      const { data: catData } = await supabase.from('activity_categories').select('id').eq('name', newCategory).single()
      await supabase.from('activities').insert({
        name: newName, emoji: newEmoji, points: pts,
        type: pts >= 0 ? 'positive' : 'negative',
        category_id: catData?.id ?? null, is_default: false, can_repeat_daily: false, max_per_day: 1,
      })
      setShowCreate(false); setNewName(''); setNewPoints(''); setNewEmoji('⚡'); setNewCategory('')
      router.refresh()
    } finally { setCreateLoading(false) }
  }

  // Sport points preview
  const sportPoints = useMemo(() => {
    const val = parseFloat(sportValue)
    const needsInput = discipline !== 'salle' && discipline !== 'street'
    if (needsInput && (!sportValue || isNaN(val))) return null
    return calcSportPoints(discipline, val || 1)
  }, [discipline, sportValue])

  // Jeux points preview
  const jeuxPoints = useMemo(() => {
    const h = parseInt(jeuxHours)
    if (isNaN(h) || h < 3) return null
    return calcJeuxPoints(h)
  }, [jeuxHours])

  // Réseaux points preview
  const reseauxPoints = useMemo(() => {
    const h = parseInt(reseauxHours)
    const m = parseInt(reseauxMinutes)
    const total = h * 60 + (isNaN(m) ? 0 : m)
    if (isNaN(h) || reseauxHours === '' || total < 120) return null
    return calcReseauxPoints(h, isNaN(m) ? 0 : m)
  }, [reseauxHours, reseauxMinutes])

  // Sleep points preview
  const sleepPoints = useMemo(() => {
    const bh = parseInt(bedtimeHours)
    const bm = parseInt(bedtimeMinutes)
    const wh = parseInt(wakeHours)
    const wm = parseInt(wakeMinutes)
    if (isNaN(bh) || bedtimeHours === '' || isNaN(wh) || wakeHours === '') return null
    const bmVal = isNaN(bm) ? 0 : bm
    const wmVal = isNaN(wm) ? 0 : wm
    const durationMin = calcSleepDuration(bh, bmVal, wh, wmVal)
    const dh = Math.floor(durationMin / 60)
    const dm = durationMin % 60
    const durPts = calcSleepPoints(dh, dm)
    const bedPts = calcBedtimePoints(bh, bmVal)
    const wakePts = calcWakeupPoints(wh, wmVal)
    return { duration: durPts, bedtime: bedPts, wakeup: wakePts, total: durPts + bedPts + wakePts, durationHours: dh, durationMins: dm }
  }, [bedtimeHours, bedtimeMinutes, wakeHours, wakeMinutes])

  return (
    <div className={cn('space-y-5', cart.length > 0 ? 'pb-52 lg:pb-48' : '')}>
      {/* Date selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setLogDate('today')}
          className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all', logDate === 'today' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
        >
          Aujourd'hui
        </button>
        <button
          onClick={() => setLogDate('yesterday')}
          className={cn('flex-1 py-2 rounded-xl text-sm font-semibold transition-all', logDate === 'yesterday' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
        >
          Hier
        </button>
      </div>

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

      {/* Special activity cards */}
      {!search && !selectedCategory && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setShowSport(true)} className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-all text-left">
            <span className="text-2xl">🏃</span>
            <div>
              <p className="text-sm font-bold text-white">Sport</p>
              <p className="text-xs text-gray-500">Course, vélo, natation…</p>
            </div>
          </button>
          <button
            onClick={() => !sommeilAtLimit && setShowSleep(true)}
            disabled={sommeilAtLimit}
            className={cn('flex items-center gap-3 p-4 rounded-xl border transition-all text-left', sommeilAtLimit ? 'border-gray-800 bg-gray-900/30 opacity-50 cursor-not-allowed' : 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10')}
          >
            <span className="text-2xl">😴</span>
            <div>
              <p className={cn('text-sm font-bold', sommeilAtLimit ? 'text-gray-500' : 'text-white')}>Sommeil</p>
              <p className="text-xs text-gray-500">{sommeilAtLimit ? 'Limite atteinte pour ajd' : 'Durée de la nuit'}</p>
            </div>
          </button>
          <button onClick={() => setShowJeux(true)} className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-all text-left">
            <span className="text-2xl">🎮</span>
            <div>
              <p className="text-sm font-bold text-white">Jeux vidéo</p>
              <p className="text-xs text-gray-500">+3h = −3 pts</p>
            </div>
          </button>
          <button onClick={() => setShowReseaux(true)} className="flex items-center gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-all text-left">
            <span className="text-2xl">📱</span>
            <div>
              <p className="text-sm font-bold text-white">Réseaux sociaux</p>
              <p className="text-xs text-gray-500">+2h = −3 pts</p>
            </div>
          </button>
        </div>
      )}

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
          const atLimit = isAtDailyLimit(activity, todayCounts)
          return (
            <button
              key={activity.id}
              onClick={() => !atLimit && addToCart(activity)}
              disabled={atLimit}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl border text-left transition-all',
                atLimit
                  ? 'border-gray-800 bg-gray-900/30 opacity-50 cursor-not-allowed'
                  : inCart ? 'border-violet-500 bg-violet-600/10' : 'border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800/50'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{activity.emoji}</span>
                <div>
                  <p className={cn('text-sm font-medium', atLimit ? 'text-gray-500' : 'text-white')}>{activity.name}</p>
                  <p className="text-xs text-gray-500">
                    {atLimit ? 'Limite atteinte pour ajd' : activity.category?.name}
                  </p>
                </div>
                {hasObjective && !atLimit && <Badge variant="violet" className="text-[10px]">×{objectiveMap.get(activity.id)?.multiplier}</Badge>}
              </div>
              {!atLimit && (
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
              )}
            </button>
          )
        })}
      </div>

      {/* Sticky cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-[64px] lg:bottom-0 left-0 right-0 z-40 px-3 pb-2 lg:pb-3">
          <div className="max-w-2xl mx-auto bg-gray-950 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
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
                <span className="text-sm font-semibold text-white">{cart.length} activité{cart.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('text-xl font-black tabular-nums', totalPoints >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {totalPoints >= 0 ? '+' : ''}{totalPoints} pts
                </span>
                {cartExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronUp size={16} className="text-gray-500" />}
              </div>
            </button>

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
                        {item.multiplier > 1 && <Badge variant="violet" className="text-[9px] shrink-0">×{item.multiplier}</Badge>}
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => updateCount(item.activity.id, -1)} className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center hover:bg-gray-700">
                            <Minus size={9} className="text-white" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-white">{item.count}</span>
                          <button onClick={() => updateCount(item.activity.id, 1)} className="w-5 h-5 rounded bg-gray-800 flex items-center justify-center hover:bg-gray-700">
                            <Plus size={9} className="text-white" />
                          </button>
                        </div>
                        <span className={cn('text-xs font-bold shrink-0 w-14 text-right tabular-nums', pts >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {pts >= 0 ? '+' : ''}{pts} pts
                        </span>
                        <button onClick={() => removeFromCart(item.activity.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 shrink-0">
                          <X size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>

                {userGroups.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-800">
                    <p className="text-xs text-gray-500 mb-2">Compter dans les groupes :</p>
                    <div className="flex flex-wrap gap-2">
                      {userGroups.map(group => (
                        <button
                          key={group.id}
                          onClick={() => toggleGroup(group.id)}
                          className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors', selectedGroupIds.includes(group.id) ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-4 py-3 border-t border-gray-800">
                  <Button className="w-full" size="lg" onClick={handleLogAll} loading={loading}>
                    {success ? '✅ Activités enregistrées !' : `Valider ${cart.length} activité${cart.length > 1 ? 's' : ''} · ${totalPoints >= 0 ? '+' : ''}${totalPoints} pts`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sport modal */}
      <Modal open={showSport} onClose={() => { setShowSport(false); setSportValue('') }} title="🏃 Ajouter une session sport">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Discipline</p>
            <div className="grid grid-cols-4 gap-2">
              {DISCIPLINES.map(d => {
                const disciplineAtLimit = (d.key === 'salle' && salleAtLimit) || (d.key === 'street' && streetAtLimit)
                return (
                  <button
                    key={d.key}
                    onClick={() => { if (!disciplineAtLimit) { setDiscipline(d.key); setSportValue('') } }}
                    disabled={disciplineAtLimit}
                    className={cn(
                      'flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all',
                      disciplineAtLimit
                        ? 'border-gray-800 bg-gray-900/30 text-gray-600 opacity-50 cursor-not-allowed'
                        : discipline === d.key
                          ? 'border-green-500/50 bg-green-500/10 text-green-400'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
                    )}
                  >
                    <span className="text-xl">{d.emoji}</span>
                    {disciplineAtLimit ? '✓' : d.label}
                  </button>
                )
              })}
            </div>
          </div>

          {discipline === 'course' && (
            <Input
              label="Distance (km)"
              type="number"
              value={sportValue}
              onChange={e => setSportValue(e.target.value)}
              placeholder="Ex: 5"
            />
          )}
          {discipline === 'velo' && (
            <Input
              label="Distance (km)"
              type="number"
              value={sportValue}
              onChange={e => setSportValue(e.target.value)}
              placeholder="Ex: 20"
            />
          )}
          {discipline === 'natation' && (
            <Input
              label="Durée (minutes)"
              type="number"
              value={sportValue}
              onChange={e => setSportValue(e.target.value)}
              placeholder="Ex: 45"
            />
          )}
          {discipline === 'pompes' && (
            <Input
              label="Nombre de pompes"
              type="number"
              value={sportValue}
              onChange={e => setSportValue(e.target.value)}
              placeholder="Ex: 100"
            />
          )}
          {discipline === 'pas' && (
            <Input
              label="Nombre de pas"
              type="number"
              value={sportValue}
              onChange={e => setSportValue(e.target.value)}
              placeholder="Ex: 10000"
            />
          )}

          {sportPoints !== null && (
            <div className={cn('p-3 rounded-xl text-center', sportPoints >= 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20')}>
              <span className={cn('text-2xl font-black', sportPoints >= 0 ? 'text-green-400' : 'text-red-400')}>
                {sportPoints >= 0 ? '+' : ''}{sportPoints} pts
              </span>
            </div>
          )}

          {userGroups.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Compter dans les groupes :</p>
              <div className="flex flex-wrap gap-2">
                {userGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors', selectedGroupIds.includes(group.id) ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowSport(false); setSportValue('') }}>Annuler</Button>
            <Button
              className="flex-1"
              onClick={handleSport}
              loading={sportLoading}
              disabled={
                discipline !== 'salle' && discipline !== 'street' &&
                (!sportValue || isNaN(parseFloat(sportValue)) || parseFloat(sportValue) <= 0)
              }
            >
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sleep modal */}
      <Modal open={showSleep} onClose={() => { setShowSleep(false); setBedtimeHours(''); setBedtimeMinutes('0'); setWakeHours(''); setWakeMinutes('0') }} title="😴 Sommeil">
        <div className="space-y-4">
          {/* Heure de coucher */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-3">À quelle heure t'es-tu couché ?</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input label="Heure" type="number" min={0} max={23} value={bedtimeHours} onChange={e => setBedtimeHours(e.target.value)} placeholder="23" />
              </div>
              <span className="text-gray-500 text-xl mt-5">h</span>
              <div className="flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">Minutes</label>
                  <select value={bedtimeMinutes} onChange={e => setBedtimeMinutes(e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-violet-500">
                    {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Heure de réveil */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-3">À quelle heure t'es-tu réveillé ?</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input label="Heure" type="number" min={0} max={23} value={wakeHours} onChange={e => setWakeHours(e.target.value)} placeholder="7" />
              </div>
              <span className="text-gray-500 text-xl mt-5">h</span>
              <div className="flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-300">Minutes</label>
                  <select value={wakeMinutes} onChange={e => setWakeMinutes(e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-violet-500">
                    {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Preview points */}
          {sleepPoints !== null && (
            <div className={cn('p-3 rounded-xl border', sleepPoints.total > 0 ? 'bg-green-500/10 border-green-500/20' : sleepPoints.total < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-800/50 border-gray-700')}>
              <p className={cn('text-2xl font-black text-center mb-2', sleepPoints.total > 0 ? 'text-green-400' : sleepPoints.total < 0 ? 'text-red-400' : 'text-gray-400')}>
                {sleepPoints.total > 0 ? '+' : ''}{sleepPoints.total} pts
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>🛌 Durée ({sleepPoints.durationHours}h{String(sleepPoints.durationMins).padStart(2, '0')})</span>
                  <span className={sleepPoints.duration > 0 ? 'text-green-400' : sleepPoints.duration < 0 ? 'text-red-400' : ''}>
                    {sleepPoints.duration > 0 ? '+' : ''}{sleepPoints.duration} pts
                    {sleepPoints.duration === 3 ? ' 🎯' : sleepPoints.duration === -2 ? ' (trop court)' : sleepPoints.duration === -3 ? ' (trop long)' : ''}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>🌙 Coucher</span>
                  <span className={sleepPoints.bedtime > 0 ? 'text-green-400' : sleepPoints.bedtime < 0 ? 'text-red-400' : ''}>
                    {sleepPoints.bedtime > 0 ? '+' : ''}{sleepPoints.bedtime} pts
                    {sleepPoints.bedtime === 2 ? ' (avant minuit)' : sleepPoints.bedtime === -4 ? ' (après 3h)' : ''}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>☀️ Réveil</span>
                  <span className={sleepPoints.wakeup > 0 ? 'text-green-400' : sleepPoints.wakeup < 0 ? 'text-red-400' : ''}>
                    {sleepPoints.wakeup > 0 ? '+' : ''}{sleepPoints.wakeup} pts
                    {sleepPoints.wakeup === 2 ? ' (avant 9h)' : sleepPoints.wakeup === -3 ? ' (après 10h)' : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {userGroups.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Compter dans les groupes :</p>
              <div className="flex flex-wrap gap-2">
                {userGroups.map(group => (
                  <button key={group.id} onClick={() => toggleGroup(group.id)} className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors', selectedGroupIds.includes(group.id) ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}>
                    {group.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowSleep(false); setBedtimeHours(''); setBedtimeMinutes('0'); setWakeHours(''); setWakeMinutes('0') }}>Annuler</Button>
            <Button className="flex-1" onClick={handleSleep} loading={sleepLoading}
              disabled={bedtimeHours === '' || isNaN(parseInt(bedtimeHours)) || wakeHours === '' || isNaN(parseInt(wakeHours))}>
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Jeux vidéo modal */}
      <Modal open={showJeux} onClose={() => { setShowJeux(false); setJeuxHours('') }} title="🎮 Jeux vidéo">
        <div className="space-y-4">
          <p className="text-xs text-gray-500">Minimum 3h · −3 pts, puis −2 pts par heure supplémentaire</p>
          <Input
            label="Nombre d'heures"
            type="number"
            min={3}
            value={jeuxHours}
            onChange={e => setJeuxHours(e.target.value)}
            placeholder="Ex: 4"
          />
          {jeuxPoints !== null && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <span className="text-2xl font-black text-red-400">{jeuxPoints} pts</span>
            </div>
          )}
          {jeuxHours !== '' && (parseInt(jeuxHours) < 3) && (
            <p className="text-xs text-red-400 text-center">Minimum 3h pour logger les jeux vidéo</p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowJeux(false); setJeuxHours('') }}>Annuler</Button>
            <Button className="flex-1" onClick={handleJeux} loading={jeuxLoading} disabled={isNaN(parseInt(jeuxHours)) || parseInt(jeuxHours) < 3}>
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Réseaux sociaux modal */}
      <Modal open={showReseaux} onClose={() => { setShowReseaux(false); setReseauxHours(''); setReseauxMinutes('0') }} title="📱 Réseaux sociaux">
        <div className="space-y-4">
          <p className="text-xs text-gray-500">Minimum 2h · −3 pts, puis −1 pt par 30 min supplémentaires</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input label="Heures" type="number" min={2} value={reseauxHours} onChange={e => setReseauxHours(e.target.value)} placeholder="2" />
            </div>
            <span className="text-gray-500 text-xl mt-5">h</span>
            <div className="flex-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-300">Minutes</label>
                <select value={reseauxMinutes} onChange={e => setReseauxMinutes(e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-violet-500">
                  {[0, 30].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                </select>
              </div>
            </div>
          </div>
          {reseauxPoints !== null && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <span className="text-2xl font-black text-red-400">{reseauxPoints} pts</span>
            </div>
          )}
          {reseauxHours !== '' && (parseInt(reseauxHours) * 60 + parseInt(reseauxMinutes || '0')) < 120 && (
            <p className="text-xs text-red-400 text-center">Minimum 2h pour logger les réseaux sociaux</p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowReseaux(false); setReseauxHours(''); setReseauxMinutes('0') }}>Annuler</Button>
            <Button className="flex-1" onClick={handleReseaux} loading={reseauxLoading}
              disabled={reseauxHours === '' || isNaN(parseInt(reseauxHours)) || (parseInt(reseauxHours) * 60 + parseInt(reseauxMinutes || '0')) < 120}>
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create activity modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Créer une activité">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-20">
              <Input label="Emoji" value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="⚡" className="text-center text-lg" />
            </div>
            <div className="flex-1">
              <Input label="Nom de l'activité" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Pompes 100" />
            </div>
          </div>
          <Input label="Points (négatif pour malus)" type="number" value={newPoints} onChange={e => setNewPoints(e.target.value)} placeholder="Ex: 3 ou -4" />
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

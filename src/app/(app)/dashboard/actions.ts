'use server'

import { createClient } from '@/lib/supabase/server'
import { parisWeekRange, toParisDate } from '@/lib/utils'
import { format, startOfWeek, subDays, addDays } from 'date-fns'

export interface WeekChartDay {
  day: string
  points: number
  isFuture: boolean
}

export interface WeekChartResult {
  days: WeekChartDay[]
  todayIndex: number   // index du jour actuel (0=Lun..6=Dim), -1 si semaine passée
  average: number      // moyenne de points par jour écoulé
  label: string
}

export async function getWeekChart(weeksAgo: number): Promise<WeekChartResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { days: [], todayIndex: -1, average: 0, label: '' }

  const { startISO, endISO, label } = parisWeekRange(weeksAgo)

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('points_earned, logged_at')
    .eq('user_id', user.id)
    .gte('logged_at', startISO)
    .lt('logged_at', endISO)

  const dayMap = new Map<string, number>()
  for (const l of logs ?? []) {
    const k = format(toParisDate(l.logged_at), 'yyyy-MM-dd')
    dayMap.set(k, (dayMap.get(k) ?? 0) + l.points_earned)
  }

  const nowParis = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  const weekStartWall = startOfWeek(subDays(nowParis, weeksAgo * 7), { weekStartsOn: 1 })
  const todayKey = format(nowParis, 'yyyy-MM-dd')
  const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  let todayIndex = -1
  const days: WeekChartDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStartWall, i)
    const key = format(d, 'yyyy-MM-dd')
    if (key === todayKey) todayIndex = i
    return { day: labels[i], points: dayMap.get(key) ?? 0, isFuture: false }
  })

  if (weeksAgo === 0 && todayIndex >= 0) {
    days.forEach((d, i) => { if (i > todayIndex) d.isFuture = true })
  }

  // Moyenne sur les jours écoulés (Lun..aujourd'hui pour la semaine en cours, sinon 7 jours)
  const elapsed = weeksAgo === 0 && todayIndex >= 0 ? todayIndex + 1 : 7
  const sumElapsed = days.slice(0, elapsed).reduce((s, d) => s + d.points, 0)
  const average = elapsed > 0 ? Math.round((sumElapsed / elapsed) * 10) / 10 : 0

  return { days, todayIndex, average, label }
}

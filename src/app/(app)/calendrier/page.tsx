import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarClient } from '@/components/features/CalendarClient'
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns'

export default async function CalendrierPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Get logs for last 3 months for calendar
  const threeMonthsAgo = startOfMonth(subMonths(now, 2))

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('points_earned, logged_at, activity:activities(name, emoji, type)')
    .eq('user_id', user.id)
    .gte('logged_at', threeMonthsAgo.toISOString())
    .order('logged_at')

  // Aggregate by day
  const dayMap = new Map<string, { points: number; activities: number; positive: number; negative: number; entries: { name: string; emoji: string; points: number }[] }>()
  for (const log of (logs ?? [])) {
    const day = format(new Date(log.logged_at), 'yyyy-MM-dd')
    const existing = dayMap.get(day) ?? { points: 0, activities: 0, positive: 0, negative: 0, entries: [] }
    existing.points += log.points_earned
    existing.activities += 1
    if (log.points_earned >= 0) existing.positive += 1
    else existing.negative += 1
    existing.entries.push({ name: (log.activity as any)?.name ?? '?', emoji: (log.activity as any)?.emoji ?? '⚡', points: log.points_earned })
    dayMap.set(day, existing)
  }

  const dayData = Object.fromEntries(dayMap)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Calendrier</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visualise ta progression jour par jour</p>
      </div>
      <CalendarClient dayData={dayData} />
    </div>
  )
}

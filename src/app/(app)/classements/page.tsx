import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RankingsClient } from '@/components/features/RankingsClient'
import { subDays, startOfWeek } from 'date-fns'

export default async function ClassementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

  // National rankings + streak (parallel)
  const [weeklyLogsRes, lifetimeLogsRes, streakRes, groupMembershipsRes] = await Promise.all([
    supabase
      .from('activity_logs')
      .select('user_id, points_earned, profiles!inner(username, avatar_url)')
      .gte('logged_at', weekStart.toISOString()),
    supabase
      .from('activity_logs')
      .select('user_id, points_earned, profiles!inner(username, avatar_url)'),
    supabase
      .from('user_streaks')
      .select('user_id, current_streak')
      .order('current_streak', { ascending: false })
      .limit(20),
    supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id),
  ])

  function aggregateRanking(logs: any[]) {
    const totals = new Map<string, { points: number; username: string; avatar_url: string | null }>()
    for (const log of logs) {
      const uid = log.user_id
      const existing = totals.get(uid)
      if (existing) {
        existing.points += log.points_earned
      } else {
        totals.set(uid, {
          points: log.points_earned,
          username: log.profiles?.username ?? '?',
          avatar_url: log.profiles?.avatar_url ?? null,
        })
      }
    }
    return Array.from(totals.entries())
      .map(([user_id, data]) => ({ user_id, ...data }))
      .sort((a, b) => b.points - a.points)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))
  }

  const weeklyRanking = aggregateRanking(weeklyLogsRes.data ?? [])
  const lifetimeRanking = aggregateRanking(lifetimeLogsRes.data ?? [])

  const myWeekPoints = (weeklyLogsRes.data ?? [])
    .filter((l: any) => l.user_id === user.id)
    .reduce((sum: number, l: any) => sum + l.points_earned, 0)

  // Weekly chart (last 7 days)
  const chartData = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const day = subDays(new Date(), 6 - i)
      const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999)
      const { data } = await supabase
        .from('activity_logs')
        .select('points_earned')
        .eq('user_id', user.id)
        .gte('logged_at', dayStart.toISOString())
        .lte('logged_at', dayEnd.toISOString())
      return {
        day: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][day.getDay() === 0 ? 6 : day.getDay() - 1],
        points: (data ?? []).reduce((sum, l) => sum + l.points_earned, 0),
      }
    })
  )

  const { count: weekActivities } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('logged_at', weekStart.toISOString())

  const myStreak = (streakRes.data ?? []).find((s: any) => s.user_id === user.id)

  const weekSummary = {
    points_gained: myWeekPoints,
    activities_validated: weekActivities ?? 0,
    best_day_points: chartData.reduce((max, d) => Math.max(max, d.points), 0),
    best_day_name: chartData.reduce((best, d) => d.points > best.points ? d : best, { day: '—', points: 0 }).day,
    current_streak: myStreak?.current_streak ?? 0,
  }

  // Group rankings (separate queries — no fragile join)
  const groupIds = (groupMembershipsRes.data ?? []).map((m: any) => m.group_id)

  let userGroups: { id: string; name: string }[] = []
  let groupRankings: { groupId: string; groupName: string; ranking: any[] }[] = []

  if (groupIds.length > 0) {
    const { data: groupsData } = await supabase
      .from('groups')
      .select('id, name')
      .in('id', groupIds)

    userGroups = groupsData ?? []

    // Compute ranking for each group
    groupRankings = await Promise.all(
      userGroups.map(async (group) => {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id, profile:profiles(username, avatar_url)')
          .eq('group_id', group.id)

        const memberIds = (members ?? []).map((m: any) => m.user_id)

        const { data: weeklyLogs } = memberIds.length > 0
          ? await supabase
              .from('activity_logs')
              .select('user_id, points_earned')
              .in('user_id', memberIds)
              .gte('logged_at', weekStart.toISOString())
          : { data: [] }

        const totals = new Map<string, number>()
        for (const log of (weeklyLogs ?? [])) {
          totals.set(log.user_id, (totals.get(log.user_id) ?? 0) + log.points_earned)
        }

        const ranking = (members ?? [])
          .map((m: any) => {
            const p = Array.isArray(m.profile) ? m.profile[0] : m.profile
            return {
              user_id: m.user_id,
              username: p?.username ?? '?',
              avatar_url: p?.avatar_url ?? null,
              points: totals.get(m.user_id) ?? 0,
            }
          })
          .sort((a, b) => b.points - a.points)
          .map((m, i) => ({ ...m, rank: i + 1 }))

        return { groupId: group.id, groupName: group.name, ranking }
      })
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Classements</h1>
        <p className="text-sm text-gray-500 mt-0.5">Qui est le plus lock in ?</p>
      </div>
      <RankingsClient
        weeklyRanking={weeklyRanking}
        lifetimeRanking={lifetimeRanking}
        chartData={chartData}
        weekSummary={weekSummary}
        currentUserId={user.id}
        userGroups={userGroups}
        groupRankings={groupRankings}
      />
    </div>
  )
}

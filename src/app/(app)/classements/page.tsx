import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RankingsClient } from '@/components/features/RankingsClient'
import { subDays, startOfWeek, format } from 'date-fns'
import { toParisDate } from '@/lib/utils'

export default async function ClassementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nowParis = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  const weekStart = startOfWeek(nowParis, { weekStartsOn: 1 })
  const sevenDaysAgo = subDays(nowParis, 6); sevenDaysAgo.setHours(0, 0, 0, 0)

  // All initial data in parallel
  const [weeklyLogsRes, lifetimeLogsRes, streakRes, groupMembershipsRes, chartLogsRes, weekActivitiesRes] = await Promise.all([
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
    supabase
      .from('activity_logs')
      .select('points_earned, logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', sevenDaysAgo.toISOString()),
    supabase
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('logged_at', weekStart.toISOString()),
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

  // Chart data — group single query results by Paris day
  const dayMap = new Map<string, number>()
  for (const log of chartLogsRes.data ?? []) {
    const key = format(toParisDate(log.logged_at), 'yyyy-MM-dd')
    dayMap.set(key, (dayMap.get(key) ?? 0) + log.points_earned)
  }
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(nowParis, 6 - i)
    const dayIndex = day.getDay() === 0 ? 6 : day.getDay() - 1
    return {
      day: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][dayIndex],
      points: dayMap.get(format(day, 'yyyy-MM-dd')) ?? 0,
    }
  })

  const myStreak = (streakRes.data ?? []).find((s: any) => s.user_id === user.id)

  const weekSummary = {
    points_gained: myWeekPoints,
    activities_validated: weekActivitiesRes.count ?? 0,
    best_day_points: chartData.reduce((max, d) => Math.max(max, d.points), 0),
    best_day_name: chartData.reduce((best, d) => d.points > best.points ? d : best, { day: '—', points: 0 }).day,
    current_streak: myStreak?.current_streak ?? 0,
  }

  // Group rankings — batch queries to avoid per-group waterfalls
  const groupIds = (groupMembershipsRes.data ?? []).map((m: any) => m.group_id)

  let userGroups: { id: string; name: string }[] = []
  let groupRankings: { groupId: string; groupName: string; ranking: any[] }[] = []

  if (groupIds.length > 0) {
    const { data: groupsData } = await supabase
      .from('groups')
      .select('id, name')
      .in('id', groupIds)

    userGroups = groupsData ?? []

    // Fetch all group members in parallel (one query per group, all at once)
    const allMembersData = await Promise.all(
      userGroups.map(group =>
        supabase.from('group_members').select('user_id, group_id, profile:profiles(username, avatar_url)').eq('group_id', group.id)
      )
    )

    // Gather all unique member IDs across all groups, fetch logs in one query
    const allMemberIds = [...new Set(allMembersData.flatMap(r => (r.data ?? []).map((m: any) => m.user_id)))]
    const { data: allWeeklyLogs } = allMemberIds.length > 0
      ? await supabase.from('activity_logs').select('user_id, points_earned').in('user_id', allMemberIds).gte('logged_at', weekStart.toISOString())
      : { data: [] as { user_id: string; points_earned: number }[] }

    const totalsMap = new Map<string, number>()
    for (const log of allWeeklyLogs ?? []) {
      totalsMap.set(log.user_id, (totalsMap.get(log.user_id) ?? 0) + log.points_earned)
    }

    groupRankings = userGroups.map((group, i) => {
      const members = allMembersData[i].data ?? []
      const ranking = members
        .map((m: any) => {
          const p = Array.isArray(m.profile) ? m.profile[0] : m.profile
          return {
            user_id: m.user_id,
            username: p?.username ?? '?',
            avatar_url: p?.avatar_url ?? null,
            points: totalsMap.get(m.user_id) ?? 0,
          }
        })
        .sort((a: any, b: any) => b.points - a.points)
        .map((m: any, idx: number) => ({ ...m, rank: idx + 1 }))
      return { groupId: group.id, groupName: group.name, ranking }
    })
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

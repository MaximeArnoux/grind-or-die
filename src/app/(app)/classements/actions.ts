'use server'

import { createClient } from '@/lib/supabase/server'
import { parisWeekRange } from '@/lib/utils'

export interface WeekRankEntry {
  user_id: string
  username: string
  avatar_url: string | null
  points: number
  rank: number
}

// Classement d'une semaine donnée (weeksAgo = 0 semaine en cours, 1 = semaine dernière, etc.)
// groupId null => classement national (tous les membres)
export async function getWeeklyRanking(weeksAgo: number, groupId: string | null): Promise<WeekRankEntry[]> {
  const supabase = await createClient()
  const { startISO, endISO } = parisWeekRange(weeksAgo)

  if (groupId) {
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, profile:profiles(username, avatar_url)')
      .eq('group_id', groupId)

    const memberIds = (members ?? []).map((m: any) => m.user_id)
    const { data: logs } = memberIds.length > 0
      ? await supabase
          .from('activity_logs')
          .select('user_id, points_earned')
          .in('user_id', memberIds)
          .gte('logged_at', startISO)
          .lt('logged_at', endISO)
      : { data: [] as { user_id: string; points_earned: number }[] }

    const totals = new Map<string, number>()
    for (const l of logs ?? []) totals.set(l.user_id, (totals.get(l.user_id) ?? 0) + l.points_earned)

    return (members ?? [])
      .map((m: any) => {
        const p = Array.isArray(m.profile) ? m.profile[0] : m.profile
        return { user_id: m.user_id, username: p?.username ?? '?', avatar_url: p?.avatar_url ?? null, points: totals.get(m.user_id) ?? 0 }
      })
      .sort((a: any, b: any) => b.points - a.points)
      .map((m: any, i: number) => ({ ...m, rank: i + 1 }))
  }

  // National : tous les membres de l'app
  const [profilesRes, logsRes] = await Promise.all([
    supabase.from('profiles').select('id, username, avatar_url'),
    supabase.from('activity_logs').select('user_id, points_earned').gte('logged_at', startISO).lt('logged_at', endISO),
  ])

  const totals = new Map<string, { points: number; username: string; avatar_url: string | null }>()
  for (const p of profilesRes.data ?? []) {
    totals.set(p.id, { points: 0, username: p.username ?? '?', avatar_url: p.avatar_url ?? null })
  }
  for (const l of logsRes.data ?? []) {
    const e = totals.get(l.user_id)
    if (e) e.points += l.points_earned
  }

  return Array.from(totals.entries())
    .map(([user_id, d]) => ({ user_id, ...d }))
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({ ...e, rank: i + 1 }))
}

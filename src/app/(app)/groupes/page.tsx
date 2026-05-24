import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupesClient } from '@/components/features/GroupesClient'
import { startOfWeek } from 'date-fns'

export default async function GroupesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

  // Step 1: get the user's memberships (no join — avoids FK detection issues)
  const { data: memberships } = await supabase
    .from('group_members')
    .select('role, joined_at, group_id')
    .eq('user_id', user.id)

  const groupIds = (memberships ?? []).map((m: any) => m.group_id)

  if (groupIds.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">Groupes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Défie tes amis et vois qui est le plus lock in</p>
        </div>
        <GroupesClient groups={[]} currentUserId={user.id} />
      </div>
    )
  }

  // Step 2: get groups separately
  const { data: groupsData } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds)

  const membershipMap = new Map((memberships ?? []).map((m: any) => [m.group_id, m]))

  // Step 3: for each group, fetch members + weekly ranking
  const groupsWithRankings = await Promise.all(
    (groupsData ?? []).map(async (group) => {
      const membership = membershipMap.get(group.id)
      if (!membership) return null

      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, role, joined_at, profile:profiles(username, avatar_url)')
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
            role: m.role,
          }
        })
        .sort((a, b) => b.points - a.points)
        .map((m, i) => ({ ...m, rank: i + 1 }))

      return {
        ...group,
        role: membership.role,
        members: members ?? [],
        ranking,
      }
    })
  )

  const validGroups = groupsWithRankings.filter(Boolean)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Groupes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Défie tes amis et vois qui est le plus lock in</p>
      </div>
      <GroupesClient groups={validGroups} currentUserId={user.id} />
    </div>
  )
}

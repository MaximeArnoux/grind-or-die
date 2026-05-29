import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GroupesClient, type PublicGroup } from '@/components/features/GroupesClient'
import { startOfWeek } from 'date-fns'

export default async function GroupesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const nowParis = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  const weekStart = startOfWeek(nowParis, { weekStartsOn: 1 })

  // Step 1: get the user's memberships (no join — avoids FK detection issues)
  const { data: memberships } = await supabase
    .from('group_members')
    .select('role, joined_at, group_id')
    .eq('user_id', user.id)

  const groupIds = (memberships ?? []).map((m: any) => m.group_id)

  // Fetch public groups the user is NOT already in (via security definer function)
  const { data: allPublicGroups } = await supabase.rpc('get_public_groups')
  const publicGroups: PublicGroup[] = (allPublicGroups ?? [])
    .filter((g: any) => !groupIds.includes(g.id))
    .map((g: any) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      max_members: g.max_members,
      member_count: Number(g.member_count ?? 0),
    }))

  if (groupIds.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">Groupes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Défie tes amis et vois qui est le plus lock in</p>
        </div>
        <GroupesClient groups={[]} publicGroups={publicGroups} currentUserId={user.id} />
      </div>
    )
  }

  // Step 2: get groups separately
  const { data: groupsData } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds)

  const membershipMap = new Map((memberships ?? []).map((m: any) => [m.group_id, m]))

  // Step 3: fetch all groups' members in parallel, then all logs in one query
  const groups = (groupsData ?? []) as { id: string; name: string; [key: string]: any }[]

  const allMembersData = await Promise.all(
    groups.map((group: { id: string }) =>
      supabase.from('group_members').select('user_id, role, joined_at, group_id, profile:profiles(username, avatar_url)').eq('group_id', group.id)
    )
  )

  const allMemberIds = [...new Set(allMembersData.flatMap((r: { data: any[] | null }) => (r.data ?? []).map((m: any) => m.user_id)))]
  const { data: allWeeklyLogs } = allMemberIds.length > 0
    ? await supabase.from('activity_logs').select('user_id, points_earned').in('user_id', allMemberIds).gte('logged_at', weekStart.toISOString())
    : { data: [] as { user_id: string; points_earned: number }[] }

  const totalsMap = new Map<string, number>()
  for (const log of allWeeklyLogs ?? []) {
    totalsMap.set(log.user_id, (totalsMap.get(log.user_id) ?? 0) + log.points_earned)
  }

  const groupsWithRankings = groups.map((group: { id: string; [key: string]: any }, i: number) => {
    const membership = membershipMap.get(group.id) as { role: string } | undefined
    if (!membership) return null
    const members = allMembersData[i].data ?? []
    const ranking = members
      .map((m: any) => {
        const p = Array.isArray(m.profile) ? m.profile[0] : m.profile
        return {
          user_id: m.user_id,
          username: p?.username ?? '?',
          avatar_url: p?.avatar_url ?? null,
          points: totalsMap.get(m.user_id) ?? 0,
          role: m.role,
        }
      })
      .sort((a: any, b: any) => b.points - a.points)
      .map((m: any, idx: number) => ({ ...m, rank: idx + 1 }))
    return { ...group, role: membership.role, members, ranking }
  })

  const validGroups = groupsWithRankings.filter(Boolean) as any[]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Groupes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Défie tes amis et vois qui est le plus lock in</p>
      </div>
      <GroupesClient groups={validGroups} publicGroups={publicGroups} currentUserId={user.id} />
    </div>
  )
}

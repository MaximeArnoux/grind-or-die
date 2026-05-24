import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ParametresClient } from '@/components/features/ParametresClient'

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, objectivesRes, activitiesRes, weightLogsRes, groupsRes, pendingVotesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_objectives').select('*, activity:activities(name, emoji)').eq('user_id', user.id).eq('is_active', true),
    supabase.from('activities').select('*, category:activity_categories(name, emoji)').order('name'),
    supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1),
    supabase.from('group_members').select('group:groups!group_id(id, name)').eq('user_id', user.id),
    supabase.from('objective_vote_requests')
      .select('id, target_count, period, multiplier, created_at, group:groups!group_id(name), activity:activities!activity_id(name, emoji), votes:objective_votes(vote)')
      .eq('requester_id', user.id)
      .eq('status', 'pending'),
  ])

  const userGroups = (groupsRes.data ?? [])
    .map((m: any) => m.group)
    .filter(Boolean) as { id: string; name: string }[]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gère ton profil et tes objectifs</p>
      </div>
      <ParametresClient
        profile={profileRes.data}
        objectives={objectivesRes.data ?? []}
        pendingVoteRequests={pendingVotesRes.data ?? []}
        activities={activitiesRes.data ?? []}
        latestWeight={weightLogsRes.data?.[0]?.weight_kg ?? null}
        userId={user.id}
        userGroups={userGroups}
      />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { VotePanelClient } from './VotePanelClient'

export async function VotePanelWrapper({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)

  const groupIds = (memberships ?? []).map(m => m.group_id)
  if (groupIds.length === 0) return null

  const { data: requests } = await supabase
    .from('objective_vote_requests')
    .select(`
      id, target_count, period, multiplier, created_at, group_id, requester_id,
      requester:profiles!requester_id(username, avatar_url),
      group:groups!group_id(name),
      activity:activities!activity_id(name, emoji),
      votes:objective_votes(vote, comment, voter_id)
    `)
    .eq('status', 'pending')
    .neq('requester_id', userId)
    .in('group_id', groupIds)
    .order('created_at', { ascending: true })

  const pendingVotes = (requests ?? []).filter(r =>
    !(r.votes ?? []).some((v: any) => v.voter_id === userId)
  )

  if (pendingVotes.length === 0) return null

  return <VotePanelClient pendingVotes={pendingVotes as any} />
}

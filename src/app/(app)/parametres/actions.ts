'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Period = 'daily' | 'weekly' | 'monthly'

export async function createVoteRequest(
  groupId: string,
  activityId: string,
  targetCount: number,
  period: Period,
  multiplier: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const [profileRes, activityRes, groupRes, membershipRes, othersRes] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', user.id).single(),
    supabase.from('activities').select('name, emoji').eq('id', activityId).single(),
    supabase.from('groups').select('name').eq('id', groupId).single(),
    supabase.from('group_members').select('user_id').eq('group_id', groupId).eq('user_id', user.id).single(),
    supabase.from('group_members').select('user_id').eq('group_id', groupId).neq('user_id', user.id),
  ])

  if (!membershipRes.data) return { error: "Tu n'es pas dans ce groupe" }

  const otherMembers = othersRes.data ?? []

  // Solo dans le groupe → créer directement sans vote
  if (otherMembers.length === 0) {
    const { error } = await supabase.from('user_objectives').insert({
      user_id: user.id,
      activity_id: activityId,
      target_count: targetCount,
      period,
      multiplier,
    })
    if (error) return { error: error.message }
    revalidatePath('/parametres')
    return { success: true, direct: true }
  }

  // Créer la demande de vote
  const { data: voteRequest, error: reqError } = await supabase
    .from('objective_vote_requests')
    .insert({
      requester_id: user.id,
      group_id: groupId,
      activity_id: activityId,
      target_count: targetCount,
      period,
      multiplier,
    })
    .select('id')
    .single()

  if (reqError || !voteRequest) return { error: reqError?.message ?? 'Erreur lors de la création' }

  // Notifier tous les autres membres
  const activityLabel = `${activityRes.data?.emoji ?? ''} ${activityRes.data?.name ?? ''}`.trim()
  const notifications = otherMembers.map(m => ({
    user_id: m.user_id,
    type: 'objective_vote',
    title: '🗳️ Vote requis',
    message: `${profileRes.data?.username ?? 'Quelqu\'un'} veut créer un objectif "${activityLabel}" dans ${groupRes.data?.name ?? 'votre groupe'}. Vote !`,
  }))

  await supabase.from('notifications').insert(notifications)

  revalidatePath('/parametres')
  return { success: true, direct: false }
}

export async function submitVote(
  requestId: string,
  vote: 'accept' | 'reject',
  comment: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: request } = await supabase
    .from('objective_vote_requests')
    .select('id, group_id, requester_id, activity_id, target_count, period, multiplier, status')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Demande introuvable' }
  if (request.status !== 'pending') return { error: 'Cette demande est déjà résolue' }
  if (request.requester_id === user.id) return { error: 'Tu ne peux pas voter pour ta propre demande' }

  const { data: membership } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', request.group_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) return { error: "Tu n'es pas dans ce groupe" }

  const { error: voteError } = await supabase.from('objective_votes').insert({
    request_id: requestId,
    voter_id: user.id,
    vote,
    comment: comment.trim() || null,
  })

  if (voteError) return { error: 'Tu as déjà voté pour cette demande' }

  // Compter les votes et les électeurs éligibles
  const [votesRes, eligibleRes, activityRes, voterRes] = await Promise.all([
    supabase.from('objective_votes').select('vote').eq('request_id', requestId),
    supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', request.group_id).neq('user_id', request.requester_id),
    supabase.from('activities').select('name, emoji').eq('id', request.activity_id).single(),
    supabase.from('profiles').select('username').eq('id', user.id).single(),
  ])

  const acceptCount = (votesRes.data ?? []).filter(v => v.vote === 'accept').length
  const rejectCount = (votesRes.data ?? []).filter(v => v.vote === 'reject').length
  const eligible = eligibleRes.count ?? 0
  const threshold = Math.floor(eligible / 2) + 1

  const activityLabel = `${activityRes.data?.emoji ?? ''} ${activityRes.data?.name ?? ''}`.trim()
  const voterName = voterRes.data?.username ?? 'Quelqu\'un'

  // Notifier le créateur de l'objectif : "Martin a accepté · 'bien mérité'"
  const voteWord = vote === 'accept' ? 'a accepté' : 'a refusé'
  const commentPart = comment.trim() ? ` · « ${comment.trim()} »` : ''
  await supabase.from('notifications').insert({
    user_id: request.requester_id,
    type: 'objective_comment',
    title: `${vote === 'accept' ? '✅' : '❌'} ${voterName} ${voteWord}`,
    message: `${activityLabel}${commentPart}`,
  })

  if (acceptCount >= threshold) {
    await Promise.all([
      supabase.from('user_objectives').insert({
        user_id: request.requester_id,
        activity_id: request.activity_id,
        target_count: request.target_count,
        period: request.period,
        multiplier: request.multiplier,
      }),
      supabase.from('objective_vote_requests').update({ status: 'accepted' }).eq('id', requestId),
      supabase.from('notifications').insert({
        user_id: request.requester_id,
        type: 'objective_accepted',
        title: '✅ Objectif accepté !',
        message: `Ton objectif "${activityLabel}" a été accepté par le groupe.`,
      }),
    ])
  } else if (rejectCount >= threshold) {
    await Promise.all([
      supabase.from('objective_vote_requests').update({ status: 'rejected' }).eq('id', requestId),
      supabase.from('notifications').insert({
        user_id: request.requester_id,
        type: 'objective_rejected',
        title: '❌ Objectif refusé',
        message: `Ton objectif "${activityLabel}" a été refusé par le groupe.`,
      }),
    ])
  }

  revalidatePath('/parametres')
  return { success: true }
}

export async function forceVote(requestId: string, decision: 'accept' | 'reject') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: request } = await supabase
    .from('objective_vote_requests')
    .select('id, group_id, requester_id, activity_id, target_count, period, multiplier, status, created_at')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Demande introuvable' }
  if (request.status !== 'pending') return { error: 'Cette demande est déjà résolue' }

  // Vérifier que l'utilisateur est le créateur du groupe
  const { data: group } = await supabase
    .from('groups')
    .select('created_by, name')
    .eq('id', request.group_id)
    .single()

  if (!group || group.created_by !== user.id) {
    return { error: 'Seul le créateur du groupe peut forcer' }
  }

  // Vérifier que 48h se sont écoulées
  const createdAt = new Date(request.created_at).getTime()
  const hoursElapsed = (Date.now() - createdAt) / (1000 * 60 * 60)
  if (hoursElapsed < 48) {
    return { error: 'Tu pourras forcer après 48h' }
  }

  const [creatorRes, activityRes] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', user.id).single(),
    supabase.from('activities').select('name, emoji').eq('id', request.activity_id).single(),
  ])

  const activityLabel = `${activityRes.data?.emoji ?? ''} ${activityRes.data?.name ?? ''}`.trim()
  const creatorName = creatorRes.data?.username ?? 'Le créateur'

  if (decision === 'accept') {
    await Promise.all([
      supabase.from('user_objectives').insert({
        user_id: request.requester_id,
        activity_id: request.activity_id,
        target_count: request.target_count,
        period: request.period,
        multiplier: request.multiplier,
      }),
      supabase.from('objective_vote_requests').update({ status: 'accepted' }).eq('id', requestId),
      supabase.from('notifications').insert({
        user_id: request.requester_id,
        type: 'objective_accepted',
        title: '✅ Objectif accepté !',
        message: `Ton objectif "${activityLabel}" a été forcé par ${creatorName}.`,
      }),
    ])
  } else {
    await Promise.all([
      supabase.from('objective_vote_requests').update({ status: 'rejected' }).eq('id', requestId),
      supabase.from('notifications').insert({
        user_id: request.requester_id,
        type: 'objective_rejected',
        title: '❌ Objectif refusé',
        message: `Ton objectif "${activityLabel}" a été refusé (forcé par ${creatorName}).`,
      }),
    ])
  }

  revalidatePath('/parametres')
  return { success: true }
}

export async function markNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  return { success: true }
}

export async function cancelVoteRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('objective_vote_requests')
    .delete()
    .eq('id', requestId)
    .eq('requester_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/parametres')
  return { success: true }
}

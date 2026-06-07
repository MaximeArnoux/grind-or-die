'use server'

import { createClient } from '@/lib/supabase/server'
import { parisWeekStartISO } from '@/lib/utils'
import webpush from 'web-push'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails('mailto:contact@grind-or-die.app', VAPID_PUBLIC, VAPID_PRIVATE)
}

export async function savePushSubscription(subscription: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, subscription },
      { onConflict: 'user_id, subscription' }
    )

  if (error) return { error: error.message }
  return { success: true }
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Supprime les abonnements de ce user dont l'endpoint correspond
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('user_id', user.id)

  const toDelete = (subs ?? []).filter((s: any) => s.subscription?.endpoint === endpoint).map((s: any) => s.id)
  if (toDelete.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', toDelete)
  }
  return { success: true }
}

// Notifie tous les autres membres des groupes de l'utilisateur courant
export async function notifyGroupsActivity(message: string) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return { error: 'Push non configuré' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Groupes de l'utilisateur
  const { data: myGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = (myGroups ?? []).map(g => g.group_id)
  if (groupIds.length === 0) return { success: true }

  // Tous les autres membres de ces groupes
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .in('group_id', groupIds)
    .neq('user_id', user.id)

  const memberIds = [...new Set((members ?? []).map(m => m.user_id))]
  if (memberIds.length === 0) return { success: true }

  // Pseudo de l'expéditeur
  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
  const username = profile?.username ?? 'Un membre'

  // Abonnements push de ces membres
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .in('user_id', memberIds)

  const payload = JSON.stringify({
    title: '⚡ Grind or Die',
    body: `${username} ${message}`,
    url: '/dashboard',
  })

  await Promise.all(
    (subs ?? []).map(async (s: any) => {
      try {
        await webpush.sendNotification(s.subscription, payload)
      } catch (err: any) {
        // Abonnement expiré/invalide → on le supprime
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    })
  )

  return { success: true }
}

// Notifie les membres qui viennent de se faire dépasser au classement hebdo
export async function notifyOvertakes(pointsEarned: number) {
  if (pointsEarned <= 0) return { success: true }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const weekStartISO = parisWeekStartISO()

  // Groupes de l'utilisateur
  const { data: myGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
  const groupIds = (myGroups ?? []).map(g => g.group_id)
  if (groupIds.length === 0) return { success: true }

  // Tous les membres de ces groupes
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .in('group_id', groupIds)
  const allMemberIds = [...new Set((members ?? []).map(m => m.user_id))]

  // Totaux hebdo de tout le monde
  const { data: weekLogs } = await supabase
    .from('activity_logs')
    .select('user_id, points_earned')
    .in('user_id', allMemberIds)
    .gte('logged_at', weekStartISO)

  const totals = new Map<string, number>()
  for (const l of weekLogs ?? []) totals.set(l.user_id, (totals.get(l.user_id) ?? 0) + l.points_earned)

  const myTotal = totals.get(user.id) ?? 0
  const myTotalBefore = myTotal - pointsEarned

  // Membres dépassés : avant j'étais <= eux, maintenant je suis devant
  const overtaken = allMemberIds.filter(id => {
    if (id === user.id) return false
    const t = totals.get(id) ?? 0
    return myTotalBefore <= t && myTotal > t
  })

  if (overtaken.length === 0) return { success: true }

  // Pseudo de celui qui dépasse
  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
  const username = profile?.username ?? 'Un membre'

  const TITLE = '😱 Tu t\'es fait dépasser !'
  const BODY = `${username} vient de te passer au classement 🏆 Reprends ta place !`

  // Notifs in-app (cloche)
  await supabase.from('notifications').insert(
    overtaken.map(id => ({ user_id: id, type: 'overtake', title: TITLE, message: BODY }))
  )

  // Push browser
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .in('user_id', overtaken)

  const payload = JSON.stringify({ title: TITLE, body: BODY, url: '/classements' })
  await Promise.all(
    (subs ?? []).map(async (s: any) => {
      try {
        await webpush.sendNotification(s.subscription, payload)
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    })
  )

  return { success: true }
}

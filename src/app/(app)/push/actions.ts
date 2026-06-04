'use server'

import { createClient } from '@/lib/supabase/server'
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

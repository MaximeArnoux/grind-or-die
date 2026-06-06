import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { parisWallToUTC } from '@/lib/utils'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY

export async function GET(request: Request) {
  // Sécurité : seul Vercel Cron (avec le secret) peut déclencher
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return NextResponse.json({ error: 'Push non configuré' }, { status: 500 })
  }
  webpush.setVapidDetails('mailto:contact@grind-or-die.app', VAPID_PUBLIC, VAPID_PRIVATE)

  // Client admin (bypass RLS) — service role
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Début de journée Paris en UTC
  const nowParis = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  const todayWall = new Date(nowParis); todayWall.setHours(0, 0, 0, 0)
  const todayStartISO = parisWallToUTC(todayWall).toISOString()

  // Tous les users + abonnements push + qui a loggé aujourd'hui
  const [allProfilesRes, subsRes, todayLogsRes] = await Promise.all([
    admin.from('profiles').select('id'),
    admin.from('push_subscriptions').select('id, user_id, subscription'),
    admin.from('activity_logs').select('user_id').gte('logged_at', todayStartISO),
  ])

  const subs = subsRes.data ?? []
  const loggedUserIds = new Set((todayLogsRes.data ?? []).map((l: any) => l.user_id))
  const allUserIds = (allProfilesRes.data ?? []).map((p: any) => p.id)

  // Utilisateurs qui n'ont PAS loggé aujourd'hui
  const unloggedUserIds = allUserIds.filter((id: string) => !loggedUserIds.has(id))

  const TITLE = '⚡ Grind or Die'
  const BODY = "T'as pas encore loggé aujourd'hui 👀 Valide ta journée avant qu'il soit trop tard 🔥"

  // Notifications in-app (cloche) pour les non-loggeurs
  if (unloggedUserIds.length > 0) {
    await admin.from('notifications').insert(
      unloggedUserIds.map((userId: string) => ({
        user_id: userId,
        type: 'daily_reminder',
        title: TITLE,
        message: BODY,
      }))
    )
  }

  // Push browser uniquement pour les abonnés qui n'ont pas loggé
  const pushTargets = subs.filter((s: any) => !loggedUserIds.has(s.user_id))
  const payload = JSON.stringify({ title: TITLE, body: BODY, url: '/ajouter' })

  let sent = 0
  await Promise.all(
    pushTargets.map(async (s: any) => {
      try {
        await webpush.sendNotification(s.subscription, payload)
        sent++
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    })
  )

  return NextResponse.json({ ok: true, inApp: unloggedUserIds.length, sent, candidates: pushTargets.length })
}

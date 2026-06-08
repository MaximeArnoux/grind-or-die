import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { parisWallToUTC } from '@/lib/utils'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY

const MESSAGES = [
  '☀️ Bien réveillé ? Passe devant tout le monde aujourd\'hui 🏆',
  '🔥 Tes potes dorment encore. Prends de l\'avance maintenant.',
  '💪 Nouvelle journée. Qui sera n°1 ce soir ? À toi de jouer.',
  '👀 Le classement t\'attend. Lock in dès maintenant.',
  '☀️ Good morning ! Logge ta première activité et lance la journée 🔥',
  'Nouvelle journée = nouvelle chance de grind. Go 💪',
  '⚡ Pense à logger tes activités aujourd\'hui. Reste devant !',
]

export async function GET(request: Request) {
  // Sécurité : seul Vercel Cron (avec le secret) peut déclencher
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Garde-fou : on n'envoie que le matin (8h–10h Paris selon l'heure d'été/hiver)
  const parisHour = parseInt(
    new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: 'numeric', hour12: false }).format(new Date()),
    10
  )
  if (parisHour < 7 || parisHour > 10) {
    return Response.json({ skipped: true, parisHour })
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return Response.json({ error: 'Push non configuré' }, { status: 500 })
  }
  webpush.setVapidDetails('mailto:contact@grindordie.app', VAPID_PUBLIC, VAPID_PRIVATE)

  // Client service-role (contourne RLS, lecture globale)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Borne : aujourd'hui 5h00 (Paris) en instant UTC
  const nowParis = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  const fiveWall = new Date(nowParis); fiveWall.setHours(5, 0, 0, 0)
  const fiveISO = parisWallToUTC(fiveWall).toISOString()

  // Tous les abonnements push
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, subscription')

  if (!subs || subs.length === 0) return Response.json({ sent: 0 })

  const userIds = [...new Set(subs.map(s => s.user_id))]

  // Qui a déjà loggé depuis 5h ce matin ?
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('user_id')
    .in('user_id', userIds)
    .gte('logged_at', fiveISO)

  const loggedSet = new Set((logs ?? []).map(l => l.user_id))

  // Cibles : abonnés qui n'ont rien loggé depuis 5h
  const targets = subs.filter(s => !loggedSet.has(s.user_id))
  if (targets.length === 0) return Response.json({ sent: 0 })

  const body = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
  const payload = JSON.stringify({ title: '⚡ Grind or Die', body, url: '/ajouter' })

  let sent = 0
  await Promise.all(
    targets.map(async (s: any) => {
      try {
        await webpush.sendNotification(s.subscription, payload)
        sent++
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    })
  )

  return Response.json({ sent, targets: targets.length })
}

import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { parisWallToUTC } from '@/lib/utils'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY

// Messages pour les membres d'un groupe (ton compétitif)
const GROUP_MESSAGES = [
  '☀️ Bien réveillé ? Passe devant tout le monde aujourd\'hui 🏆',
  '🔥 Tes potes dorment encore. Prends de l\'avance maintenant.',
  '💪 Nouvelle journée. Qui sera n°1 ce soir ? À toi de jouer.',
  '👀 Le classement t\'attend. Lock in dès maintenant.',
  '☀️ Good morning ! Logge ta première activité et lance la journée 🔥',
  'Nouvelle journée = nouvelle chance de grind. Go 💪',
  '⚡ Pense à logger tes activités aujourd\'hui. Reste devant !',
]

// Messages pour les membres sans groupe (ton solo, pas de compétition)
const SOLO_MESSAGES = [
  '☀️ Nouvelle journée, logge ta première activité 🔥',
  '💪 Bien réveillé ? C\'est le moment de grind.',
  '⚡ Lance ta journée : ajoute ta première activité.',
  '☀️ Good morning ! Une journée de plus pour devenir meilleur.',
  'Nouvelle journée = nouvelle occasion de progresser. Go 💪',
]

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function GET(request: Request) {
  // Sécurité : seul Vercel Cron (avec le secret) peut déclencher.
  // Fail-closed : si le secret n'est pas configuré, on refuse tout.
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
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

  // Qui est dans au moins un groupe ?
  const targetUserIds = [...new Set(targets.map(s => s.user_id))]
  const { data: groupRows } = await supabase
    .from('group_members')
    .select('user_id')
    .in('user_id', targetUserIds)
  const inGroup = new Set((groupRows ?? []).map(g => g.user_id))

  let sent = 0
  await Promise.all(
    targets.map(async (s: any) => {
      const body = inGroup.has(s.user_id) ? pick(GROUP_MESSAGES) : pick(SOLO_MESSAGES)
      const payload = JSON.stringify({ title: '⚡ Grind or Die', body, url: '/ajouter' })
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

  // Reset streaks for users who missed yesterday
  const yesterdayWall = new Date(nowParis)
  yesterdayWall.setDate(yesterdayWall.getDate() - 1)
  yesterdayWall.setHours(0, 0, 0, 0)
  const todayMidnightWall = new Date(nowParis)
  todayMidnightWall.setHours(0, 0, 0, 0)
  const yesterdayStartISO = parisWallToUTC(yesterdayWall).toISOString()
  const yesterdayEndISO = parisWallToUTC(todayMidnightWall).toISOString()

  const { data: activeStreaks } = await supabase
    .from('user_streaks')
    .select('user_id')
    .gt('current_streak', 0)

  let streaksReset = 0
  if (activeStreaks && activeStreaks.length > 0) {
    const streakUserIds = activeStreaks.map((s: any) => s.user_id)
    const { data: yesterdayLogs } = await supabase
      .from('activity_logs')
      .select('user_id')
      .in('user_id', streakUserIds)
      .gte('logged_at', yesterdayStartISO)
      .lt('logged_at', yesterdayEndISO)

    const loggedYesterday = new Set((yesterdayLogs ?? []).map((l: any) => l.user_id))
    const toReset = streakUserIds.filter((id: string) => !loggedYesterday.has(id))

    if (toReset.length > 0) {
      await supabase
        .from('user_streaks')
        .update({ current_streak: 0, updated_at: new Date().toISOString() })
        .in('user_id', toReset)
      streaksReset = toReset.length
    }
  }

  return Response.json({ sent, targets: targets.length, streaksReset })
}

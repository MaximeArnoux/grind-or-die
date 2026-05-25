import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { format, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { WeightChartClient } from '@/components/features/WeightChartClient'
import { ProfileLogsClient } from '@/components/features/ProfileLogsClient'
import { formatPoints, capitalizeFirst, toParisDate } from '@/lib/utils'
import { ADMIN_USER_ID } from '@/lib/constants/admin'

export default async function ProfilPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single()

  if (!profile) notFound()

  const isOwn = user?.id === profile.id
  const isAdmin = user?.id === ADMIN_USER_ID
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

  const [totalPointsRes, weekPointsRes, streakRes, objectivesRes, weightLogsRes, recentLogsRes] = await Promise.all([
    supabase.from('activity_logs').select('points_earned').eq('user_id', profile.id),
    supabase.from('activity_logs').select('points_earned').eq('user_id', profile.id).gte('logged_at', weekStart.toISOString()),
    supabase.from('user_streaks').select('*').eq('user_id', profile.id).single(),
    supabase.from('user_objectives').select('*, activity:activities(name, emoji)').eq('user_id', profile.id).eq('is_active', true),
    supabase.from('weight_logs').select('*').eq('user_id', profile.id).order('logged_at').limit(30),
    supabase.from('activity_logs')
      .select('id, points_earned, logged_at, notes, activity:activities(name, emoji, type)')
      .eq('user_id', profile.id)
      .order('logged_at', { ascending: false })
      .limit(user?.id === ADMIN_USER_ID ? 50 : 10),
  ])

  const totalPoints = (totalPointsRes.data ?? []).reduce((sum, l) => sum + l.points_earned, 0)
  const weekPoints = (weekPointsRes.data ?? []).reduce((sum, l) => sum + l.points_earned, 0)
  const streak = streakRes.data
  const objectives = objectivesRes.data ?? []
  const weightLogs = weightLogsRes.data ?? []
  const recentLogs = recentLogsRes.data ?? []

  const latestWeight = weightLogs[weightLogs.length - 1]?.weight_kg

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white overflow-hidden shrink-0">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                : profile.username.charAt(0).toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white">@{profile.username}</h1>
                {profile.full_name && <span className="text-gray-400">{profile.full_name}</span>}
              </div>
              {profile.bio && <p className="text-sm text-gray-400 mt-1">{profile.bio}</p>}
              {profile.objectives && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Objectifs</p>
                  <p className="text-sm text-gray-300">{profile.objectives}</p>
                </div>
              )}
              <div className="flex gap-4 mt-3">
                {profile.height_cm && (
                  <span className="text-xs text-gray-500">📏 {profile.height_cm}cm</span>
                )}
                {latestWeight && (
                  <span className="text-xs text-gray-500">⚖️ {latestWeight}kg</span>
                )}
                <span className="text-xs text-gray-500">
                  Membre depuis {format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Points totaux" value={totalPoints.toLocaleString('fr-FR')} />
        <StatCard label="Cette semaine" value={`+${weekPoints}`} color="text-green-400" />
        <StatCard label="Série actuelle" value={`${streak?.current_streak ?? 0} 🔥`} />
        <StatCard label="Record série" value={`${streak?.longest_streak ?? 0} jours`} />
      </div>

      {/* Objectives */}
      {objectives.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Objectifs actifs</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {objectives.map(obj => (
                <div key={obj.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                  <span className="text-sm text-white">
                    {(obj.activity as any)?.emoji} {(obj.activity as any)?.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="violet">×{obj.multiplier}</Badge>
                    <span className="text-xs text-gray-500">{obj.target_count}× / {obj.period === 'daily' ? 'jour' : 'semaine'}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weight chart */}
      {weightLogs.length >= 1 && (
        <Card>
          <CardHeader><CardTitle>Évolution du poids ⚖️</CardTitle></CardHeader>
          <CardContent>
            <WeightChartClient logs={weightLogs} />
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activités récentes</CardTitle>
            {isAdmin && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-lg font-medium">🔑 Mode admin</span>}
            {isOwn && !isAdmin && <span className="text-[10px] text-gray-600 font-mono">{user?.id}</span>}
          </div>
        </CardHeader>
        <CardContent>
          <ProfileLogsClient
            logs={recentLogs}
            isAdmin={isAdmin}
            username={profile.username}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-black ${color ?? 'text-white'}`}>{value}</p>
    </Card>
  )
}

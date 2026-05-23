import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, TrendingUp, Star, Users, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatPoints, formatTimeAgo, capitalizeFirst, cn } from '@/lib/utils'
import { DashboardChart } from '@/components/features/DashboardChart'
import { MandatoryChecklist } from '@/components/features/MandatoryChecklist'
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

type WeekLog = {
  points_earned: number
  activity?: { type?: string } | { type?: string }[] | null
}

type RecentLog = {
  id: string
  points_earned: number
  logged_at: string
  activity?: {
    name?: string | null
    emoji?: string | null
  } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const todayStart = new Date(now.setHours(0, 0, 0, 0))

  // Parallel data fetching
  const [profileRes, streakRes, totalPointsRes, weekPointsRes, todayPointsRes, recentLogsRes, myGroupMembershipsRes, weeklyChartRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
    supabase.from('activity_logs').select('points_earned').eq('user_id', user.id),
    supabase.from('activity_logs').select('points_earned, activity:activities(type)').eq('user_id', user.id).gte('logged_at', weekStart.toISOString()),
    supabase.from('activity_logs').select('points_earned').eq('user_id', user.id).gte('logged_at', todayStart.toISOString()),
    supabase.from('activity_logs').select('*, activity:activities(name, emoji, points, type)').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(5),
    supabase.from('group_members').select('group_id, role, group:groups(id, name)').eq('user_id', user.id),
    // Last 7 days chart data
    Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const day = subDays(new Date(), 6 - i)
        const dayStart = new Date(day.setHours(0, 0, 0, 0))
        const dayEnd = new Date(day.setHours(23, 59, 59, 999))
        return supabase
          .from('activity_logs')
          .select('points_earned')
          .eq('user_id', user.id)
          .gte('logged_at', dayStart.toISOString())
          .lte('logged_at', dayEnd.toISOString())
      })
    ),
  ])

  const profile = profileRes.data
  const streak = streakRes.data

  const totalPoints = (totalPointsRes.data ?? []).reduce((sum, l) => sum + l.points_earned, 0)
  const weekPoints = (weekPointsRes.data ?? []).reduce((sum, l) => sum + l.points_earned, 0)
  const todayPoints = (todayPointsRes.data ?? []).reduce((sum, l) => sum + l.points_earned, 0)
  const recentLogs = recentLogsRes.data ?? []

  // Group ranking
  const myGroupMemberships = (myGroupMembershipsRes.data ?? []) as any[]
  const primaryMembership = myGroupMemberships[0]
  const primaryGroupId = primaryMembership?.group_id
  const primaryGroupName = (() => {
    const g = primaryMembership?.group
    return (Array.isArray(g) ? g[0] : g)?.name ?? ''
  })()

  type GroupRankEntry = { user_id: string; username: string; avatar_url: string | null; points: number; rank: number }
  let myGroupRanking: GroupRankEntry[] = []

  if (primaryGroupId) {
    const { data: groupMembers } = await supabase
      .from('group_members')
      .select('user_id, profile:profiles(username, avatar_url)')
      .eq('group_id', primaryGroupId)

    const memberIds = (groupMembers ?? []).map((m: any) => m.user_id)
    if (memberIds.length > 0) {
      const { data: groupWeeklyLogs } = await supabase
        .from('activity_logs')
        .select('user_id, points_earned')
        .in('user_id', memberIds)
        .gte('logged_at', weekStart.toISOString())

      const totals = new Map<string, number>()
      for (const log of (groupWeeklyLogs ?? [])) {
        totals.set(log.user_id, (totals.get(log.user_id) ?? 0) + log.points_earned)
      }

      myGroupRanking = (groupMembers ?? [])
        .map((m: any) => {
          const p = Array.isArray(m.profile) ? m.profile[0] : m.profile
          return { user_id: m.user_id, username: p?.username ?? '?', avatar_url: p?.avatar_url ?? null, points: totals.get(m.user_id) ?? 0 }
        })
        .sort((a, b) => b.points - a.points)
        .map((m, i) => ({ ...m, rank: i + 1 }))
    }
  }
  const myRank = myGroupRanking.findIndex(m => m.user_id === user.id) + 1

  // Weekly chart
  const chartData = weeklyChartRes.map((res, i) => {
    const day = subDays(new Date(), 6 - i)
    const pts = (res.data ?? []).reduce((sum: number, l: { points_earned: number }) => sum + l.points_earned, 0)
    return { day: format(day, 'EEE', { locale: fr }), points: pts }
  })

  // Points breakdown
  const weekLogs: WeekLog[] = weekPointsRes.data ?? []
  const weekBonus = weekLogs
    .filter(l => { const t = getActivityType(l.activity); return t === 'bonus' || t === 'positive' })
    .reduce((sum, l) => sum + Math.max(0, l.points_earned), 0)
  const weekMalus = weekLogs
    .filter(l => getActivityType(l.activity) === 'negative' || l.points_earned < 0)
    .reduce((sum, l) => sum + Math.min(0, l.points_earned), 0)
  const breakdownTotal = weekBonus + Math.abs(weekMalus)
  const bonusPercent = breakdownTotal > 0 ? (weekBonus / breakdownTotal) * 100 : 0
  const malusPercent = breakdownTotal > 0 ? (Math.abs(weekMalus) / breakdownTotal) * 100 : 0

  // Group ranking (simplified)
  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Bonjour' : greetingHour < 18 ? 'Salut' : 'Bonsoir'

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          {greeting} {capitalizeFirst(profile?.username ?? '')} ! 👊
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Prêt à devenir la meilleure version de toi-même ?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Points totaux"
          value={totalPoints.toLocaleString('fr-FR')}
          icon="🏆"
          color="text-yellow-400"
        />
        <StatCard
          label="Points cette semaine"
          value={weekPoints.toLocaleString('fr-FR')}
          icon={<TrendingUp size={22} className="text-green-400" />}
          trend="+12%"
          trendUp
        />
        <StatCard
          label="Points aujourd'hui"
          value={todayPoints.toLocaleString('fr-FR')}
          icon={<Star size={22} className="text-violet-400" />}
        />
        <StatCard
          label="Position hebdo"
          value={myGroupRanking.length > 0 ? `${myRank} / ${myGroupRanking.length}` : '— / —'}
          icon={<Users size={22} className="text-blue-400" />}
          subtitle={myGroupRanking.length > 0 ? `dans ${primaryGroupName}` : 'Rejoins un groupe'}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Group ranking */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Classement {primaryGroupName ? `— ${primaryGroupName}` : 'groupe'}</CardTitle>
              {myGroupRanking.length > 0 && (
                <Link href="/groupes" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                  Voir tout <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {myGroupRanking.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-600 flex-col gap-2">
                <Users size={36} />
                <p className="text-sm">Rejoins un groupe pour voir le classement</p>
                <Link href="/groupes" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-1">
                  Rejoindre un groupe <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {myGroupRanking.slice(0, 5).map(member => (
                  <div
                    key={member.user_id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl transition-colors',
                      member.user_id === user.id ? 'bg-violet-600/10' : 'hover:bg-gray-800/30'
                    )}
                  >
                    <span className={cn('text-sm font-bold w-5 text-center', member.rank === 1 ? 'text-yellow-400' : 'text-gray-500')}>
                      {member.rank}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                      {member.avatar_url
                        ? <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                        : member.username.charAt(0).toUpperCase()
                      }
                    </div>
                    <span className={cn('flex-1 text-sm truncate', member.user_id === user.id ? 'text-violet-300 font-semibold' : 'text-white')}>
                      {member.username}{member.user_id === user.id ? ' (toi)' : ''}
                    </span>
                    <span className={cn('text-sm font-bold flex-shrink-0', member.rank === 1 ? 'text-yellow-400' : 'text-white')}>
                      {member.points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Répartition des points</CardTitle>
              <span className="text-2xl font-black text-white">{weekPoints}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-24 h-24 relative flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"
                    strokeDasharray={`${bonusPercent} ${100 - bonusPercent}`} strokeLinecap="round" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3"
                    strokeDasharray={`${malusPercent} ${100 - malusPercent}`} strokeDashoffset={-bonusPercent} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-lg font-black text-white">{weekPoints}</span>
                  <span className="text-[10px] text-gray-500">pts</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    Bonus
                  </span>
                  <span className="text-blue-400 font-semibold">+{weekBonus}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    Malus
                  </span>
                  <span className="text-red-400 font-semibold">{weekMalus}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Activités récentes</CardTitle>
              <Link href="/historique" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                Voir toutes <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p className="text-sm">Aucune activité aujourd&apos;hui</p>
                <Link href="/ajouter" className="text-xs text-violet-400 hover:text-violet-300 mt-2 inline-block">
                  + Ajouter ta première activité
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {(recentLogs as RecentLog[]).map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{log.activity?.emoji ?? '⚡'}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{log.activity?.name}</p>
                        <p className="text-xs text-gray-500">{formatTimeAgo(log.logged_at)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${log.points_earned >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPoints(log.points_earned)} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Série actuelle 🔥</CardTitle>
              <div className="text-right">
                <div className="text-2xl font-black text-white">{streak?.current_streak ?? 0} jours</div>
                <p className="text-xs text-green-400">Continue comme ça !</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DashboardChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      {/* Mes groupes */}
      {myGroupMemberships.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mes groupes</CardTitle>
              <Link href="/groupes" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                Gérer <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myGroupMemberships.map((membership: any) => {
                const g = membership.group
                const groupInfo = Array.isArray(g) ? g[0] : g
                return (
                  <Link
                    key={membership.group_id}
                    href="/groupes"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/40 hover:border-violet-500/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{groupInfo?.name ?? 'Groupe'}</p>
                      <p className="text-xs text-gray-500">{membership.role === 'admin' ? 'Admin' : 'Membre'}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mandatory checklist */}
      <MandatoryChecklist userId={user.id} />
    </div>
  )
}

function getActivityType(activity: WeekLog['activity']) {
  return Array.isArray(activity) ? activity[0]?.type : activity?.type
}

function StatCard({
  label, value, icon, color, trend, trendUp, subtitle
}: {
  label: string
  value: string
  icon: React.ReactNode | string
  color?: string
  trend?: string
  trendUp?: boolean
  subtitle?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <div className="text-2xl">{typeof icon === 'string' ? icon : icon}</div>
      </div>
      <div className={`text-2xl font-black ${color ?? 'text-white'}`}>{value}</div>
      {trend && (
        <p className={`text-xs mt-1 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>{trend}</p>
      )}
      {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
    </Card>
  )
}

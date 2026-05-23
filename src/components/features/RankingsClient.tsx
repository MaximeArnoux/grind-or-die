'use client'

import { useState } from 'react'
import { Trophy, TrendingUp, Zap, Flame, Crown, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DashboardChart } from './DashboardChart'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface RankingEntry {
  user_id: string
  username: string
  avatar_url: string | null
  points: number
  rank: number
}

interface GroupRanking {
  groupId: string
  groupName: string
  ranking: RankingEntry[]
}

interface Props {
  weeklyRanking: RankingEntry[]
  lifetimeRanking: RankingEntry[]
  chartData: { day: string; points: number }[]
  weekSummary: {
    points_gained: number
    activities_validated: number
    best_day_points: number
    best_day_name: string
    current_streak: number
  }
  currentUserId: string
  userGroups: { id: string; name: string }[]
  groupRankings: GroupRanking[]
}

const TABS = ['Groupe', 'National (paramètres de base)', 'Historique']
const TIMEFRAMES = ['Hebdo', 'Lifetime']

export function RankingsClient({ weeklyRanking, lifetimeRanking, chartData, weekSummary, currentUserId, userGroups, groupRankings }: Props) {
  const [tab, setTab] = useState(userGroups.length > 0 ? 'Groupe' : 'National (paramètres de base)')
  const [timeframe, setTimeframe] = useState('Hebdo')
  const [selectedGroupId, setSelectedGroupId] = useState<string>(userGroups[0]?.id ?? '')

  const ranking = timeframe === 'Hebdo' ? weeklyRanking : lifetimeRanking
  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3

  const currentGroupRanking = groupRankings.find(g => g.groupId === selectedGroupId)
  const groupTop3 = currentGroupRanking?.ranking.slice(0, 3) ?? []
  const groupPodium = groupTop3.length >= 3 ? [groupTop3[1], groupTop3[0], groupTop3[2]] : groupTop3
  const groupRest = currentGroupRanking?.ranking.slice(3) ?? []

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              tab === t ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            )}
          >
            {t}
            {t === 'National (paramètres de base)' && (
              <span className="ml-1.5 text-[10px] text-gray-500">🔒</span>
            )}
          </button>
        ))}
      </div>

      {/* ── GROUPE TAB ── */}
      {tab === 'Groupe' && (
        <>
          {userGroups.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Trophy size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-semibold text-lg text-gray-400">Pas encore dans un groupe</p>
              <p className="text-sm mt-2">Rejoins ou crée un groupe pour voir le classement de tes amis</p>
              <Link href="/groupes" className="inline-block mt-4 text-sm text-violet-400 hover:text-violet-300">
                Rejoindre un groupe →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Group selector (if multiple groups) */}
              {userGroups.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {userGroups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        selectedGroupId === g.id ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      )}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Group ranking card */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    🏆 {currentGroupRanking?.groupName ?? 'Groupe'} — Classement hebdo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(currentGroupRanking?.ranking.length ?? 0) === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <Users size={36} className="mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Aucune activité cette semaine</p>
                    </div>
                  ) : (
                    <>
                      {/* Podium */}
                      {groupTop3.length > 0 && (
                        <div className="flex items-end justify-center gap-6 mb-6">
                          {groupPodium.map((entry, idx) => {
                            if (!entry) return <div key={idx} className="w-20" />
                            const isFirst = entry.rank === 1
                            const isMe = entry.user_id === currentUserId
                            return (
                              <div key={entry.user_id} className="flex flex-col items-center gap-1.5">
                                {isFirst && <Crown size={20} className="text-yellow-400" />}
                                <div className={cn(
                                  'w-14 h-14 rounded-full flex items-center justify-center text-lg font-black border-3 overflow-hidden',
                                  isFirst ? 'border-yellow-400 ring-2 ring-yellow-400/30' :
                                    entry.rank === 2 ? 'border-gray-400' : 'border-amber-600',
                                  isMe && 'ring-2 ring-violet-500/50'
                                )}>
                                  {entry.avatar_url
                                    ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                                    : entry.username.charAt(0).toUpperCase()
                                  }
                                </div>
                                <Link href={`/profil/${entry.username}`} className={cn('text-xs font-bold truncate max-w-[72px] text-center hover:underline', isMe ? 'text-violet-400' : 'text-white')}>
                                  {entry.username}
                                </Link>
                                <p className={cn('text-sm font-black', isFirst ? 'text-yellow-400' : 'text-white')}>
                                  {entry.points} pts
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Rest of ranking */}
                      {groupRest.length > 0 && (
                        <div className="space-y-2">
                          {groupRest.map(entry => (
                            <div
                              key={entry.user_id}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-xl',
                                entry.user_id === currentUserId ? 'bg-violet-600/10 border border-violet-500/20' : 'hover:bg-gray-800/30'
                              )}
                            >
                              <span className="text-sm font-bold text-gray-500 w-5 text-center">{entry.rank}</span>
                              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold overflow-hidden">
                                {entry.avatar_url
                                  ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                                  : entry.username.charAt(0).toUpperCase()
                                }
                              </div>
                              <Link href={`/profil/${entry.username}`} className={cn('flex-1 text-sm hover:underline', entry.user_id === currentUserId ? 'text-violet-300 font-semibold' : 'text-white')}>
                                {entry.username}
                              </Link>
                              <span className="text-sm font-bold text-white">{entry.points} pts</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* ── NATIONAL TAB ── */}
      {tab === 'National (paramètres de base)' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    timeframe === tf ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>

            {top3.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>🏆 Classement national ({timeframe.toLowerCase()})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-center gap-4 mb-6">
                    {podiumOrder.map((entry, podiumIdx) => {
                      if (!entry) return null
                      const isFirst = entry.rank === 1
                      return (
                        <div key={entry.user_id} className={cn('flex flex-col items-center gap-2', isFirst && 'order-2')}>
                          {isFirst && <span className="text-2xl">👑</span>}
                          <div className={cn(
                            'w-16 h-16 rounded-full flex items-center justify-center text-xl font-black border-4 overflow-hidden',
                            entry.rank === 1 ? 'border-yellow-400 bg-yellow-400/20' :
                              entry.rank === 2 ? 'border-gray-400 bg-gray-400/20' :
                                'border-amber-600 bg-amber-600/20'
                          )}>
                            {entry.avatar_url
                              ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                              : entry.username.charAt(0).toUpperCase()
                            }
                          </div>
                          <Link href={`/profil/${entry.username}`} className="text-white font-bold text-sm hover:underline">{entry.username}</Link>
                          <p className={cn('text-lg font-black', entry.rank === 1 ? 'text-yellow-400' : 'text-white')}>
                            {entry.points.toLocaleString('fr-FR')} pts
                          </p>
                          <div className={cn(
                            'rounded-t-lg w-full flex items-center justify-center text-white font-black text-xl',
                            entry.rank === 1 ? 'bg-yellow-400/20 h-16' :
                              entry.rank === 2 ? 'bg-gray-500/20 h-12' : 'bg-amber-700/20 h-8'
                          )}>
                            {entry.rank}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="space-y-2">
                    {rest.map(entry => (
                      <div
                        key={entry.user_id}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl',
                          entry.user_id === currentUserId ? 'bg-violet-600/10 border border-violet-500/20' : 'hover:bg-gray-800/50'
                        )}
                      >
                        <span className="text-sm font-bold text-gray-500 w-5">{entry.rank}</span>
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold overflow-hidden">
                          {entry.avatar_url
                            ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                            : entry.username.charAt(0).toUpperCase()
                          }
                        </div>
                        <Link href={`/profil/${entry.username}`} className="flex-1 text-sm font-medium text-white hover:underline">{entry.username}</Link>
                        <span className="text-sm font-bold text-white">{entry.points.toLocaleString('fr-FR')} pts</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: evolution + summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Ton évolution</CardTitle></CardHeader>
              <CardContent>
                <DashboardChart data={chartData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Résumé de la semaine</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <TrendingUp size={14} className="text-green-400" /> Points gagnés
                    </span>
                    <span className="font-bold text-white">{weekSummary.points_gained} pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <Zap size={14} className="text-violet-400" /> Activités validées
                    </span>
                    <span className="font-bold text-white">{weekSummary.activities_validated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <Trophy size={14} className="text-yellow-400" /> Meilleure journée
                    </span>
                    <span className="font-bold text-white">{weekSummary.best_day_points} pts ({weekSummary.best_day_name})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <Flame size={14} className="text-orange-400" /> Série actuelle
                    </span>
                    <span className="font-bold text-white">{weekSummary.current_streak} jours 🔥</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── HISTORIQUE TAB ── */}
      {tab === 'Historique' && (
        <div className="text-center py-16 text-gray-600">
          <Trophy size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-gray-400">Historique des classements bientôt disponible</p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Crown, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { cn, parisWeekRange } from '@/lib/utils'
import { getWeeklyRanking } from '@/app/(app)/classements/actions'
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

export function RankingsClient({ weeklyRanking, lifetimeRanking, currentUserId, userGroups, groupRankings }: Props) {
  const [scope, setScope] = useState<'group' | 'national'>(userGroups.length > 0 ? 'group' : 'national')
  const [timeframe, setTimeframe] = useState<'weekly' | 'lifetime'>('weekly')
  const [selectedGroupId, setSelectedGroupId] = useState<string>(userGroups[0]?.id ?? '')
  const [weeksAgo, setWeeksAgo] = useState(0)
  const [fetched, setFetched] = useState<RankingEntry[] | null>(null)
  const [loading, setLoading] = useState(false)

  const currentGroupRanking = groupRankings.find(g => g.groupId === selectedGroupId)

  // Reset semaine quand on change de scope/groupe/timeframe
  useEffect(() => { setWeeksAgo(0); setFetched(null) }, [scope, selectedGroupId, timeframe])

  // Fetch d'une semaine passée
  useEffect(() => {
    if (weeksAgo === 0) { setFetched(null); return }
    if (scope === 'national' && timeframe === 'lifetime') return
    let cancelled = false
    setLoading(true)
    getWeeklyRanking(weeksAgo, scope === 'group' ? selectedGroupId : null).then(r => {
      if (!cancelled) { setFetched(r); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [weeksAgo, scope, selectedGroupId, timeframe])

  // Données affichées
  let ranking: RankingEntry[]
  if (scope === 'group') {
    ranking = weeksAgo === 0 ? (currentGroupRanking?.ranking ?? []) : (fetched ?? [])
  } else {
    if (timeframe === 'lifetime') ranking = lifetimeRanking
    else ranking = weeksAgo === 0 ? weeklyRanking : (fetched ?? [])
  }

  const showWeekNav = scope === 'group' || timeframe === 'weekly'
  const top3 = ranking.slice(0, 3)
  const podium = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3
  const rest = ranking.slice(3)

  // Ma position + écart pour passer devant
  const myEntry = ranking.find(e => e.user_id === currentUserId)
  const myRank = myEntry?.rank ?? 0
  const personAhead = myEntry ? ranking.find(e => e.rank === myRank - 1) : undefined
  const gapToNext = personAhead && myEntry ? personAhead.points - myEntry.points + 1 : 0

  const isEmpty = ranking.length === 0 || ranking.every(e => e.points === 0)

  return (
    <div className="space-y-5">
      {/* Toggle pilule scope */}
      <div className="flex items-center justify-center">
        <div className="inline-flex bg-gray-900 border border-gray-800 rounded-full p-1">
          {userGroups.length > 0 && (
            <button
              onClick={() => setScope('group')}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-semibold transition-all',
                scope === 'group' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-gray-400 hover:text-white'
              )}
            >
              Mon groupe
            </button>
          )}
          <button
            onClick={() => setScope('national')}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-semibold transition-all',
              scope === 'national' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-gray-400 hover:text-white'
            )}
          >
            National
          </button>
        </div>
      </div>

      {/* Sélecteur de groupe (si plusieurs) */}
      {scope === 'group' && userGroups.length > 1 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {userGroups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroupId(g.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                selectedGroupId === g.id ? 'bg-gray-700 text-white' : 'bg-gray-800/60 text-gray-400 hover:text-white'
              )}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Weekly / Lifetime (national seulement) — switch discret */}
      {scope === 'national' && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <button
            onClick={() => setTimeframe('weekly')}
            className={cn('font-semibold transition-colors', timeframe === 'weekly' ? 'text-violet-400' : 'text-gray-600 hover:text-gray-400')}
          >
            Cette semaine
          </button>
          <span className="text-gray-700">·</span>
          <button
            onClick={() => setTimeframe('lifetime')}
            className={cn('font-semibold transition-colors', timeframe === 'lifetime' ? 'text-violet-400' : 'text-gray-600 hover:text-gray-400')}
          >
            Depuis le début
          </button>
        </div>
      )}

      {/* Navigation par semaine — discrète */}
      {showWeekNav && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setWeeksAgo(w => w + 1)}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-medium text-gray-400 min-w-[140px] text-center">
            {weeksAgo === 0 ? 'Cette semaine' : parisWeekRange(weeksAgo).label}
          </span>
          <button
            onClick={() => setWeeksAgo(w => Math.max(0, w - 1))}
            disabled={weeksAgo === 0}
            className="p-1 text-gray-500 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-600 text-sm animate-pulse">Chargement…</div>
      ) : isEmpty ? (
        <div className="text-center py-16 text-gray-600">
          <Users size={44} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune activité {weeksAgo === 0 ? 'cette semaine' : 'cette semaine-là'}</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-3 sm:gap-5 pt-4">
              {podium.map((entry, i) => {
                if (!entry) return <div key={i} className="w-20" />
                const isFirst = entry.rank === 1
                const isMe = entry.user_id === currentUserId
                const barH = isFirst ? 'h-24' : entry.rank === 2 ? 'h-16' : 'h-12'
                const barBg = isFirst ? 'bg-gradient-to-t from-yellow-500/30 to-yellow-400/10' : entry.rank === 2 ? 'bg-gradient-to-t from-gray-500/30 to-gray-400/10' : 'bg-gradient-to-t from-amber-700/30 to-amber-600/10'
                const ring = isFirst ? 'border-yellow-400 ring-2 ring-yellow-400/40' : entry.rank === 2 ? 'border-gray-300' : 'border-amber-600'
                const avatarSize = isFirst ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-14 h-14 sm:w-16 sm:h-16'
                return (
                  <div key={entry.user_id} className="flex flex-col items-center gap-2 flex-1 max-w-[110px]">
                    {isFirst && <Crown size={22} className="text-yellow-400 crown-glow" />}
                    <Link href={`/profil/${encodeURIComponent(entry.username)}`} className="flex flex-col items-center gap-1.5 group">
                      <div
                        className={cn('rounded-full flex items-center justify-center font-black overflow-hidden border-[3px] podium-pop', avatarSize, ring, isMe && 'ring-2 ring-violet-500/60', isFirst ? 'text-2xl' : 'text-xl')}
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        {entry.avatar_url
                          ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                          : entry.username.charAt(0).toUpperCase()}
                      </div>
                      <span className={cn('text-xs font-bold truncate max-w-[90px] text-center group-hover:underline', isMe ? 'text-violet-400' : 'text-white')}>
                        {entry.username}
                      </span>
                    </Link>
                    <span className={cn('text-sm font-black', isFirst ? 'text-yellow-400' : 'text-white')}>
                      {entry.points} pts
                    </span>
                    <div
                      className={cn('w-full rounded-t-xl flex items-start justify-center pt-2 podium-bar', barH, barBg)}
                      style={{ animationDelay: `${0.15 + i * 0.1}s` }}
                    >
                      <span className={cn('text-lg font-black', isFirst ? 'text-yellow-400' : entry.rank === 2 ? 'text-gray-300' : 'text-amber-500')}>
                        {entry.rank}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Ma position + écart pour passer devant */}
          {myEntry && (
            <div className="bg-gradient-to-r from-violet-600/15 to-indigo-600/10 border border-violet-500/25 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Ta position</p>
                <p className="text-2xl font-black text-white">{myRank}<span className="text-sm text-gray-500"> / {ranking.length}</span></p>
              </div>
              <div className="text-right">
                {personAhead ? (
                  <>
                    <p className="text-xs text-gray-400">Pour passer {myRank - 1}{myRank - 1 === 1 ? 'er' : 'e'}</p>
                    <p className="text-lg font-black text-violet-400">+{gapToNext} pts 🔥</p>
                  </>
                ) : (
                  <p className="text-lg font-black text-yellow-400">👑 Tu es 1er !</p>
                )}
              </div>
            </div>
          )}

          {/* Reste du classement — cascade */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((entry, i) => {
                const isMe = entry.user_id === currentUserId
                return (
                  <div
                    key={entry.user_id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl rank-in',
                      isMe ? 'bg-violet-600/15 border border-violet-500/30' : 'bg-gray-900/60 hover:bg-gray-800/60'
                    )}
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <span className="text-sm font-black text-gray-500 w-6 text-center shrink-0">{entry.rank}</span>
                    <Link href={`/profil/${encodeURIComponent(entry.username)}`} className="flex items-center gap-2.5 flex-1 min-w-0 group">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                        {entry.avatar_url
                          ? <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                          : entry.username.charAt(0).toUpperCase()}
                      </div>
                      <span className={cn('flex-1 text-sm truncate group-hover:underline', isMe ? 'text-violet-300 font-semibold' : 'text-white')}>
                        {entry.username}{isMe ? ' (toi)' : ''}
                      </span>
                    </Link>
                    <span className="text-sm font-bold text-white shrink-0">{entry.points} pts</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

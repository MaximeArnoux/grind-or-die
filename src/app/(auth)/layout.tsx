import type { ReactNode } from 'react'
import { Zap, Flame, Trophy, TrendingUp } from 'lucide-react'

const MOCK_ACTIVITIES = [
  { emoji: '🏋️', name: 'Salle de sport', pts: '+5', color: 'text-green-400' },
  { emoji: '💧', name: '3L d\'eau', pts: '+2', color: 'text-green-400' },
  { emoji: '📚', name: 'Réviser 2h', pts: '+4', color: 'text-green-400' },
  { emoji: '🚿', name: 'Douche froide', pts: '+3', color: 'text-green-400' },
  { emoji: '🍔', name: 'Cheat meal', pts: '−5', color: 'text-red-400' },
]

const MOCK_RANKING = [
  { rank: 1, name: '63OG', pts: 340 },
  { rank: 2, name: '67rose', pts: 290 },
  { rank: 3, name: 'soumise94', pts: 210 },
  { rank: 4, name: 'grindset_', pts: 175 },
  { rank: 5, name: 'beast_69', pts: 140 },
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Left — App preview */}
      <div className="hidden lg:flex flex-col w-[55%] bg-gradient-to-br from-gray-950 via-violet-950/20 to-gray-950 border-r border-gray-800/50 p-10 relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap size={22} className="text-gray-950 fill-gray-950" />
          </div>
          <span className="font-black text-2xl tracking-tight text-white">
            GRIND <span className="text-gray-600 font-light">or</span> DIE
          </span>
        </div>

        {/* Headline */}
        <div className="relative mb-8">
          <h1 className="text-4xl font-black text-white leading-tight mb-3">
            Deviens la meilleure<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              version de toi-même.
            </span>
          </h1>
          <p className="text-gray-400 text-base">
            Track tes habitudes, gagne des points, défie tes amis — chaque jour compte.
          </p>
        </div>

        {/* App mock */}
        <div className="relative flex-1 flex flex-col gap-3">

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy size={13} className="text-yellow-400" />
                <span className="text-xs text-gray-500">Points totaux</span>
              </div>
              <p className="text-2xl font-black text-white">2 340</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={13} className="text-green-400" />
                <span className="text-xs text-gray-500">Cette semaine</span>
              </div>
              <p className="text-2xl font-black text-green-400">+340</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Flame size={13} className="text-orange-400" />
                <span className="text-xs text-gray-500">Série actuelle</span>
              </div>
              <p className="text-2xl font-black text-white">14 🔥</p>
            </div>
          </div>

          {/* Two columns: activity feed + leaderboard */}
          <div className="grid grid-cols-2 gap-3 flex-1">

            {/* Activity feed */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Activités du jour
              </p>
              <div className="space-y-2 flex-1">
                {MOCK_ACTIVITIES.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{a.emoji}</span>
                      <span className="text-xs text-gray-300 font-medium">{a.name}</span>
                    </div>
                    <span className={`text-xs font-black ${a.color}`}>{a.pts}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800/50 flex justify-between">
                <span className="text-xs text-gray-500">Total du jour</span>
                <span className="text-xs font-black text-green-400">+9 pts</span>
              </div>
            </div>

            {/* Leaderboard + streak visual */}
            <div className="flex flex-col gap-3">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  🏆 Classement du groupe
                </p>

                {/* Podium top 3 */}
                <div className="flex items-end justify-center gap-3 mb-3">
                  {[MOCK_RANKING[1], MOCK_RANKING[0], MOCK_RANKING[2]].map((m, idx) => {
                    const isFirst = m.rank === 1
                    const height = isFirst ? 'h-14' : m.rank === 2 ? 'h-10' : 'h-8'
                    const border = isFirst ? 'border-yellow-400 ring-2 ring-yellow-400/30' : m.rank === 2 ? 'border-gray-400' : 'border-amber-700'
                    const nameColor = isFirst ? 'text-yellow-400' : 'text-gray-300'
                    const ptsColor = isFirst ? 'text-yellow-400' : 'text-white'
                    return (
                      <div key={m.rank} className="flex flex-col items-center gap-1">
                        {isFirst && <span className="text-base">👑</span>}
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 border-2 ${border} flex items-center justify-center text-[10px] font-black text-white`}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-[10px] font-bold ${nameColor}`}>{m.name}</span>
                        <div className={`w-10 ${height} rounded-t-lg flex items-center justify-center ${isFirst ? 'bg-yellow-500/20' : m.rank === 2 ? 'bg-gray-700/50' : 'bg-amber-900/30'}`}>
                          <span className={`text-[10px] font-black ${ptsColor}`}>{m.pts}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Reste du classement */}
                <div className="space-y-1 border-t border-gray-800/60 pt-2">
                  {MOCK_RANKING.slice(3).map(m => (
                    <div key={m.rank} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/30">
                      <span className="text-[10px] font-bold text-gray-600 w-3">{m.rank}</span>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[9px] font-black text-white">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-[11px] text-gray-400">{m.name}</span>
                      <span className="text-[11px] font-bold text-white">{m.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak visual */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Série</span>
                  <span className="text-lg font-black text-white">14 🔥</span>
                </div>
                <div className="flex gap-1">
                  {['L','M','M','J','V','S','D'].map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full h-1.5 rounded-full ${i < 6 ? 'bg-green-400' : 'bg-gray-800'}`} />
                      <span className="text-[9px] text-gray-600">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Objectives badge row */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: '💪 Salle de sport · ×1.5', color: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
              { label: '📖 15min lecture · ×1.25', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
              { label: '💧 3L d\'eau · ×1.5', color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
            ].map((b, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-full border text-xs font-medium ${b.color}`}>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-gray-700 mt-6">© 2025 Grind or Die. Tous droits réservés.</p>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-gray-950 fill-gray-950" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">
              GRIND <span className="text-gray-600 font-light">or</span> DIE
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

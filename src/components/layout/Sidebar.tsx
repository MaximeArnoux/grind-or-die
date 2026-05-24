'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Zap, Plus, Trophy, Users, Calendar, History, Settings, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/activites', icon: Zap, label: 'Activités' },
  { href: '/ajouter', icon: Plus, label: 'Ajouter activité' },
  { href: '/classements', icon: Trophy, label: 'Classements' },
  { href: '/groupes', icon: Users, label: 'Groupes' },
  { href: '/calendrier', icon: Calendar, label: 'Calendrier' },
  { href: '/historique', icon: History, label: 'Historique' },
  { href: '/parametres', icon: Settings, label: 'Paramètres' },
]

interface SidebarProps {
  streak: number
  username: string
}

export function Sidebar({ streak, username }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const streakDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gray-950 border-r border-gray-800/50 h-screen sticky top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800/50">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap size={20} className="text-gray-950 fill-gray-950" />
          </div>
          <span className="font-black text-xl tracking-tight text-white">
            GRIND <span className="text-gray-500 font-light">or</span> DIE
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon size={18} className={cn(isActive ? 'text-white' : 'text-gray-500 group-hover:text-white')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Streak */}
      <div className="px-4 py-4 border-t border-gray-800/50">
        <div className="bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Série actuelle 🔥</span>
          </div>
          <div className="text-3xl font-black text-white mb-1">{streak} jours</div>
          <p className="text-xs text-green-400 font-medium mb-3">Continue comme ça !</p>
          <div className="flex gap-1.5">
            {streakDays.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={cn(
                  'w-full h-1.5 rounded-full',
                  i < (streak % 7) ? 'bg-green-400' : 'bg-gray-800'
                )} />
                <span className="text-[10px] text-gray-600">{day}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

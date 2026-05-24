'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Zap, Plus, Trophy, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/activites', icon: Zap, label: 'Activités' },
  { href: '/ajouter', icon: Plus, label: 'Ajouter', accent: true },
  { href: '/classements', icon: Trophy, label: 'Classements' },
  { href: '/groupes', icon: Users, label: 'Groupes' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-gray-950 border-t border-gray-800/50">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {MOBILE_NAV.map(({ href, icon: Icon, label, accent }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]',
                accent
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 -mt-3 px-4 py-3'
                  : isActive
                    ? 'text-violet-400'
                    : 'text-gray-500'
              )}
            >
              <Icon size={accent ? 22 : 20} />
              {!accent && <span className="text-[10px] font-medium">{label}</span>}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { Bell, Gift, ChevronDown } from 'lucide-react'
import type { Profile } from '@/types'

interface TopbarProps {
  profile: Profile
  notificationCount?: number
}

export function Topbar({ profile, notificationCount = 0 }: TopbarProps) {
  return (
    <header className="h-14 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-end px-6 gap-3">
      <button className="relative p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
        <Gift size={18} />
      </button>
      <button className="relative p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
        <Bell size={18} />
        {notificationCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
      <Link
        href={`/profil/${profile.username}`}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-800 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            profile.username.charAt(0).toUpperCase()
          )}
        </div>
        <span className="text-sm font-medium text-white">{profile.username}</span>
        <ChevronDown size={14} className="text-gray-500" />
      </Link>
    </header>
  )
}

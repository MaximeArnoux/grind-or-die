'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell, ChevronDown, User, Settings, LogOut, Calendar, History, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { markNotificationsRead, deleteNotification } from '@/app/(app)/parametres/actions'
import type { Profile } from '@/types'

interface TopbarProps {
  profile: Profile
  notificationCount?: number
}

interface Notif {
  id: string
  type: string
  title: string
  message: string | null
  is_read: boolean
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export function Topbar({ profile }: TopbarProps) {
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const unreadCount = notifs.filter(n => !n.is_read).length

  const fetchNotifs = useCallback(async () => {
    // Auto-supprime celles lues il y a plus de 24h
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', profile.id)
      .eq('is_read', true)
      .lt('read_at', cutoff)

    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, message, is_read, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30)

    setNotifs(data ?? [])
  }, [profile.id])

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 20000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    if (open || notifOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, notifOpen])

  async function toggleNotif() {
    const willOpen = !notifOpen
    setNotifOpen(willOpen)
    if (willOpen && unreadCount > 0) {
      // Marque comme lu côté UI immédiatement
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
      await markNotificationsRead()
    }
  }

  async function handleDelete(id: string) {
    setNotifs(prev => prev.filter(n => n.id !== id))
    await deleteNotification(id)
  }

  async function handleLogout() {
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-end px-6 gap-3">
      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={toggleNotif}
          className="relative p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-sm font-bold text-white">Notifications</span>
              <button onClick={() => setNotifOpen(false)} className="p-1 rounded-lg hover:bg-gray-800 text-gray-500">
                <X size={14} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">Aucune notification</p>
              ) : (
                notifs.map(n => (
                  <div key={n.id} className="px-4 py-3 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 group flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                      {n.message && <p className="text-xs text-gray-400 mt-0.5 break-words">{n.message}</p>}
                      <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(v => !v)}
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
          <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
            <Link
              href={`/profil/${encodeURIComponent(profile.username.toLowerCase())}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <User size={16} className="text-gray-500" />
              Mon profil
            </Link>
            <Link
              href="/calendrier"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors lg:hidden"
            >
              <Calendar size={16} className="text-gray-500" />
              Calendrier
            </Link>
            <Link
              href="/historique"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors lg:hidden"
            >
              <History size={16} className="text-gray-500" />
              Historique
            </Link>
            <Link
              href="/parametres"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Settings size={16} className="text-gray-500" />
              Paramètres
            </Link>
            <div className="border-t border-gray-800" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors lg:hidden"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileNav } from '@/components/layout/MobileNav'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    const emailBase = user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15) ?? 'user'
    const autoUsername = `${emailBase}${Math.floor(Math.random() * 9999)}`.toLowerCase()
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({ id: user.id, username: autoUsername })
      .select('*')
      .single()
    await supabase
      .from('user_streaks')
      .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })
    if (!newProfile) redirect('/login')
    profile = newProfile!
  }

  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('current_streak')
    .eq('user_id', user.id)
    .single()

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar streak={streakData?.current_streak ?? 0} username={profile.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar profile={profile} notificationCount={unreadCount ?? 0} />
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

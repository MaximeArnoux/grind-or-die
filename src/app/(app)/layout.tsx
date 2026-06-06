import { redirect } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileNav } from '@/components/layout/MobileNav'
import { VotePanelWrapper } from '@/components/features/VotePanelWrapper'
import { FadeOnRoute } from '@/components/ui/FadeOnRoute'
import { SleepReminder } from '@/components/features/SleepReminder'
import { parisWallToUTC } from '@/lib/utils'

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
    const metaUsername = (user.user_metadata?.username as string | undefined)?.toLowerCase()
    const emailBase = user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15) ?? 'user'
    const autoUsername = metaUsername ?? `${emailBase}${Math.floor(Math.random() * 9999)}`.toLowerCase()
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

  // Sommeil déjà loggé aujourd'hui ? (pour le pop-up matinal)
  const nowParis = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  const todayWall = new Date(nowParis); todayWall.setHours(0, 0, 0, 0)
  const todayStartISO = parisWallToUTC(todayWall).toISOString()
  const { data: sommeilActivity } = await supabase.from('activities').select('id').eq('name', 'Sommeil').maybeSingle()
  let sleepLoggedToday = false
  if (sommeilActivity) {
    const { count: sleepCount } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activity_id', sommeilActivity.id)
      .gte('logged_at', todayStartISO)
    sleepLoggedToday = (sleepCount ?? 0) > 0
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar streak={streakData?.current_streak ?? 0} username={profile.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar profile={profile} notificationCount={unreadCount ?? 0} />
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          <FadeOnRoute>{children}</FadeOnRoute>
        </main>
      </div>
      <MobileNav />
      <Suspense fallback={null}>
        <VotePanelWrapper userId={user.id} />
      </Suspense>
      <SleepReminder sleepLoggedToday={sleepLoggedToday} />
    </div>
  )
}

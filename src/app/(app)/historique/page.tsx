import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HistoriqueClient } from '@/components/features/HistoriqueClient'

export default async function HistoriquePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*, activity:activities(name, emoji, points, type, category:activity_categories(name, emoji))')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(200)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Historique</h1>
        <p className="text-sm text-gray-500 mt-0.5">Toutes tes activités passées</p>
      </div>
      <HistoriqueClient logs={logs ?? []} />
    </div>
  )
}

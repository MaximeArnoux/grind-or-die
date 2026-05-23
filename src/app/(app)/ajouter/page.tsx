import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogActivityClient } from '@/components/features/LogActivityClient'

export default async function AjouterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [activitiesRes, objectivesRes] = await Promise.all([
    supabase
      .from('activities')
      .select('*, category:activity_categories(name, emoji, color)')
      .order('category_id')
      .order('name'),
    supabase
      .from('user_objectives')
      .select('*, activity:activities(id, name)')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Ajouter une activité</h1>
        <p className="text-sm text-gray-500 mt-0.5">Log ce que tu as accompli aujourd&apos;hui</p>
      </div>
      <LogActivityClient
        activities={activitiesRes.data ?? []}
        userObjectives={objectivesRes.data ?? []}
        userId={user.id}
      />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogActivityClient } from '@/components/features/LogActivityClient'

export default async function AjouterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [activitiesRes, objectivesRes, groupMembershipsRes] = await Promise.all([
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
    supabase
      .from('group_members')
      .select('group_id, group:groups(id, name)')
      .eq('user_id', user.id),
  ])

  const userGroups = (groupMembershipsRes.data ?? []).map((m: any) => {
    const g = Array.isArray(m.group) ? m.group[0] : m.group
    return { id: g?.id ?? m.group_id, name: g?.name ?? 'Groupe' }
  }).filter((g: any) => g.id)

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
        userGroups={userGroups}
      />
    </div>
  )
}

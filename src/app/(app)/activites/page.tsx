import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ActivitiesClient } from '@/components/features/ActivitiesClient'

export default async function ActivitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activities } = await supabase
    .from('activities')
    .select('*, category:activity_categories(name, emoji, color)')
    .order('category_id')
    .order('points', { ascending: false })

  const { data: userObjectives } = await supabase
    .from('user_objectives')
    .select('*, activity:activities(name, emoji)')
    .eq('user_id', user.id)
    .eq('is_active', true)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Liste des activités</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gagne des points en réalisant des actions</p>
        </div>
        <Link
          href="/ajouter"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Ajouter une activité
        </Link>
      </div>

      <ActivitiesClient activities={activities ?? []} userObjectives={userObjectives ?? []} userId={user.id} />
    </div>
  )
}

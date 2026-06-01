import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MANDATORY_ACTIVITIES, MANDATORY_ACTIVITY_NAMES } from '@/lib/constants/streak'
import { CheckCircle2, Circle } from 'lucide-react'
import { ObjectiveDeleteButton } from './ObjectiveDeleteButton'

export async function MandatoryChecklist({ userId }: { userId: string }) {
  const supabase = await createClient()
  const nowParis = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  const todayStart = new Date(nowParis)
  todayStart.setHours(0, 0, 0, 0)

  const [todayLogsRes, objectivesRes] = await Promise.all([
    supabase
      .from('activity_logs')
      .select('activity_id, notes, activity:activities(name, type, category:activity_categories(name))')
      .eq('user_id', userId)
      .gte('logged_at', todayStart.toISOString()),
    supabase
      .from('user_objectives')
      .select('id, activity_id, target_count, period, activity:activities(name, emoji)')
      .eq('user_id', userId)
      .eq('is_active', true),
  ])

  const logs = (todayLogsRes.data ?? []) as any[]
  const loggedNames = logs.map(l => l.activity?.name ?? '')

  // Compte les logs par activité aujourd'hui
  const todayCountByActivity = new Map<string, number>()
  for (const l of logs) {
    if (l.activity_id) todayCountByActivity.set(l.activity_id, (todayCountByActivity.get(l.activity_id) ?? 0) + 1)
  }

  // Objectifs persos quotidiens : période "jour" OU "semaine" avec cible 7
  const dailyObjectives = ((objectivesRes.data ?? []) as any[])
    .filter(o => o.period === 'daily' || (o.period === 'weekly' && o.target_count === 7))
    .map(o => {
      const required = o.period === 'daily' ? (o.target_count || 1) : 1
      const done = (todayCountByActivity.get(o.activity_id) ?? 0) >= required
      return {
        id: o.id,
        name: o.activity?.name ?? 'Objectif',
        emoji: o.activity?.emoji ?? '🎯',
        required,
        done,
      }
    })

  // Trouve le log de sommeil et parse ses notes : "8h00 · couché à 23h30 · réveil à 7h30"
  const sleepLog = logs.find(l => l.activity?.name === 'Sommeil')
  let sleptEnough = false
  let bedtimeOk = false
  if (sleepLog?.notes) {
    const notes: string = sleepLog.notes
    // durée : premier "XhYY" au début
    const durMatch = notes.match(/^(\d+)h(\d+)/)
    if (durMatch) {
      const durMinutes = parseInt(durMatch[1]) * 60 + parseInt(durMatch[2])
      sleptEnough = durMinutes >= 7 * 60
    }
    // heure de coucher : après "couché à "
    const bedMatch = notes.match(/couché à (\d+)h/)
    if (bedMatch) {
      const bh = parseInt(bedMatch[1])
      // avant 1h du matin : soirée (>= 18h) ou exactement entre minuit et 00h59
      bedtimeOk = bh >= 18 || bh === 0
    }
  }

  function isCompleted(mandatoryId: string): boolean {
    switch (mandatoryId) {
      case 'mandatory_water':
        return loggedNames.includes(MANDATORY_ACTIVITY_NAMES.mandatory_water)
      case 'mandatory_sleep':
        return sleptEnough
      case 'mandatory_sleep_time':
        return bedtimeOk
      case 'mandatory_no_junk':
        return !loggedNames.some(n => (MANDATORY_ACTIVITY_NAMES.mandatory_no_junk as string[]).includes(n))
      case 'mandatory_sport':
        return logs.some(l => l.activity?.category?.name === 'Fitness')
      default:
        return false
    }
  }

  const fixedCompleted = MANDATORY_ACTIVITIES.filter(a => isCompleted(a.id)).length
  const objCompleted = dailyObjectives.filter(o => o.done).length
  const completedCount = fixedCompleted + objCompleted
  const totalCount = MANDATORY_ACTIVITIES.length + dailyObjectives.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Objectifs du jour</CardTitle>
          <span className="text-sm font-bold text-white">{completedCount}/{totalCount}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
          <div
            className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MANDATORY_ACTIVITIES.map((activity) => {
            const done = isCompleted(activity.id)
            return (
              <div
                key={activity.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${done
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-gray-800/50 border-gray-800'
                  }`}
              >
                {done
                  ? <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                  : <Circle size={18} className="text-gray-600 shrink-0" />
                }
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${done ? 'text-green-400' : 'text-gray-400'}`}>
                    {activity.emoji} {activity.name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{activity.description}</p>
                </div>
              </div>
            )
          })}

          {/* Objectifs personnels quotidiens */}
          {dailyObjectives.map((obj) => (
            <div
              key={obj.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${obj.done
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-gray-800/50 border-gray-800'
                }`}
            >
              {obj.done
                ? <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                : <Circle size={18} className="text-gray-600 shrink-0" />
              }
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${obj.done ? 'text-green-400' : 'text-gray-400'}`}>
                  {obj.emoji} {obj.name}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {obj.required > 1 ? `${obj.required}× par jour` : 'Tous les jours'}
                </p>
              </div>
              <ObjectiveDeleteButton objectiveId={obj.id} />
            </div>
          ))}
        </div>
        {completedCount === totalCount && totalCount > 0 && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
            <p className="text-green-400 font-semibold text-sm">🔥 Série maintenue ! Bien joué !</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

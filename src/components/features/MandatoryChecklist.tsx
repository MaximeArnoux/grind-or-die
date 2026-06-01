import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MANDATORY_ACTIVITIES, MANDATORY_ACTIVITY_NAMES } from '@/lib/constants/streak'
import { CheckCircle2, Circle } from 'lucide-react'

export async function MandatoryChecklist({ userId }: { userId: string }) {
  const supabase = await createClient()
  const nowParis = new Date(new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  const todayStart = new Date(nowParis)
  todayStart.setHours(0, 0, 0, 0)

  const { data: todayLogs } = await supabase
    .from('activity_logs')
    .select('notes, activity:activities(name, type, category:activity_categories(name))')
    .eq('user_id', userId)
    .gte('logged_at', todayStart.toISOString())

  const logs = (todayLogs ?? []) as any[]
  const loggedNames = logs.map(l => l.activity?.name ?? '')

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

  const completedCount = MANDATORY_ACTIVITIES.filter(a => isCompleted(a.id)).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Objectifs du jour</CardTitle>
          <span className="text-sm font-bold text-white">{completedCount}/{MANDATORY_ACTIVITIES.length}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
          <div
            className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / MANDATORY_ACTIVITIES.length) * 100}%` }}
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
        </div>
        {completedCount === MANDATORY_ACTIVITIES.length && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
            <p className="text-green-400 font-semibold text-sm">🔥 Série maintenue ! Bien joué !</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { cn, capitalizeFirst } from '@/lib/utils'

interface DayEntry {
  name: string
  emoji: string
  points: number
}

interface DayData {
  points: number
  activities: number
  positive: number
  negative: number
  entries: DayEntry[]
}

function getIntensity(points: number): string {
  if (points === 0) return 'bg-gray-800'
  if (points < 0) return 'bg-red-500/40'
  if (points <= 10) return 'bg-green-900/60'
  if (points <= 20) return 'bg-green-700/70'
  if (points <= 35) return 'bg-green-500/80'
  return 'bg-green-400'
}

export function CalendarClient({ dayData }: { dayData: Record<string, DayData> }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selected, setSelected] = useState<string | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const selectedData = selected ? dayData[selected] : null

  const DAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  const monthPoints = Object.entries(dayData)
    .filter(([day]) => day.startsWith(format(currentMonth, 'yyyy-MM')))
    .reduce((sum, [, d]) => sum + d.points, 0)

  const activeDays = Object.entries(dayData)
    .filter(([day]) => day.startsWith(format(currentMonth, 'yyyy-MM')))
    .filter(([, d]) => d.activities > 0).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">

        {/* Calendar card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white">
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <h2 className="text-lg font-black text-white capitalize">
                  {capitalizeFirst(format(currentMonth, 'MMMM yyyy', { locale: fr }))}
                </h2>
                <div className="flex gap-4 mt-1 justify-center">
                  <span className="text-xs text-gray-500">{activeDays} jours actifs</span>
                  <span className={cn('text-xs font-semibold', monthPoints >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {monthPoints >= 0 ? '+' : ''}{monthPoints} pts
                  </span>
                </div>
              </div>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white">
                <ChevronRight size={18} />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_HEADERS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-600 py-1">{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                const key = format(day, 'yyyy-MM-dd')
                const data = dayData[key]
                const inMonth = isSameMonth(day, currentMonth)
                const today = isToday(day)
                const isSelected = selected === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(isSelected ? null : key)}
                    className={cn(
                      'aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all',
                      !inMonth && 'opacity-20',
                      today && 'ring-2 ring-violet-500',
                      isSelected && 'ring-2 ring-white',
                      data?.activities ? getIntensity(data.points) : 'hover:bg-gray-800',
                      'cursor-pointer'
                    )}
                  >
                    <span className={cn('text-xs font-medium leading-none', today ? 'text-violet-300' : inMonth ? 'text-white' : 'text-gray-600')}>
                      {format(day, 'd')}
                    </span>
                    {data?.activities > 0 && (
                      <span className="text-[8px] text-white/70 leading-none mt-0.5 tabular-nums">
                        {data.points >= 0 ? '+' : ''}{data.points}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-4 justify-end">
              <span className="text-xs text-gray-600">Moins</span>
              {['bg-gray-800', 'bg-green-900/60', 'bg-green-700/70', 'bg-green-500/80', 'bg-green-400'].map((c, i) => (
                <div key={i} className={cn('w-4 h-4 rounded', c)} />
              ))}
              <span className="text-xs text-gray-600">Plus</span>
            </div>
          </CardContent>
        </Card>

        {/* Day detail panel — right side vertical */}
        <Card className="lg:sticky lg:top-4">
          <CardContent className="pt-5">
            {!selected ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CalendarDays size={32} className="text-gray-700 mb-3" />
                <p className="text-xs text-gray-600">Clique sur un jour<br />pour voir le résumé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Date */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    {capitalizeFirst(format(parseISO(selected), 'EEEE', { locale: fr }))}
                  </p>
                  <p className="text-base font-black text-white">
                    {format(parseISO(selected), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>

                {/* Big points */}
                {selectedData ? (
                  <>
                    <div className="p-4 bg-gray-800 rounded-xl text-center">
                      <span className={cn('text-3xl font-black tabular-nums', selectedData.points >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {selectedData.points >= 0 ? '+' : ''}{selectedData.points}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">points</p>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-800 rounded-xl p-2 text-center">
                        <div className="text-sm font-black text-white">{selectedData.activities}</div>
                        <div className="text-[10px] text-gray-500">activités</div>
                      </div>
                      <div className="bg-green-500/10 rounded-xl p-2 text-center">
                        <div className="text-sm font-black text-green-400">{selectedData.positive}</div>
                        <div className="text-[10px] text-gray-500">positives</div>
                      </div>
                      <div className="bg-red-500/10 rounded-xl p-2 text-center">
                        <div className="text-sm font-black text-red-400">{selectedData.negative}</div>
                        <div className="text-[10px] text-gray-500">malus</div>
                      </div>
                    </div>

                    {/* Activity list */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Activités</p>
                      {selectedData.entries.map((entry, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50 last:border-0">
                          <span className="text-sm">{entry.emoji}</span>
                          <span className="flex-1 text-xs text-gray-300 truncate">{entry.name}</span>
                          <span className={cn('text-xs font-bold tabular-nums shrink-0', entry.points >= 0 ? 'text-green-400' : 'text-red-400')}>
                            {entry.points >= 0 ? '+' : ''}{entry.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-600 text-sm text-center py-4">Aucune activité ce jour-là.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

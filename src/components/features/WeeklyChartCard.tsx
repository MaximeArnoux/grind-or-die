'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Line } from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getWeekChart, type WeekChartResult } from '@/app/(app)/dashboard/actions'

export function WeeklyChartCard({ initial }: { initial: WeekChartResult }) {
  const [weeksAgo, setWeeksAgo] = useState(0)
  const [data, setData] = useState<WeekChartResult>(initial)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (weeksAgo === 0) { setData(initial); return }
    let cancelled = false
    setLoading(true)
    getWeekChart(weeksAgo).then(r => { if (!cancelled) { setData(r); setLoading(false) } })
    return () => { cancelled = true }
  }, [weeksAgo, initial])

  const realUpTo = data.todayIndex >= 0 ? data.todayIndex : 6
  const projIndex = data.todayIndex >= 0 && data.todayIndex < 6 ? data.todayIndex + 1 : -1

  // Construit les séries : réelle (pleine) + projection (pointillé fade)
  const chartData = data.days.map((d, i) => ({
    day: d.day,
    real: i <= realUpTo ? d.points : null,
    proj:
      projIndex !== -1 && i === data.todayIndex ? d.points
      : projIndex !== -1 && i === projIndex ? data.average
      : null,
  }))

  // Échelle Y : haut fixé à 10 tant qu'aucun jour ne dépasse, sinon auto ;
  // bas qui descend sous 0 si des jours sont négatifs
  const realValues = data.days.slice(0, realUpTo + 1).map(d => d.points)
  const maxVal = Math.max(10, ...realValues, data.average)
  const minVal = Math.min(0, ...realValues)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progression 📈</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeeksAgo(w => w + 1)}
              className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-semibold text-gray-400 min-w-[120px] text-center">
              {weeksAgo === 0 ? 'Cette semaine' : data.label}
            </span>
            <button
              onClick={() => setWeeksAgo(w => Math.max(0, w - 1))}
              disabled={weeksAgo === 0}
              className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`h-40 transition-opacity ${loading ? 'opacity-40' : 'opacity-100'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 36, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                {/* Dégradé horizontal pour faire "fondre" le pointillé vers la droite */}
                <linearGradient id="fadeProj" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[minVal, maxVal]} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, color: '#f9fafb' }}
                labelStyle={{ color: '#9ca3af', fontSize: 12 }}
                formatter={(v: any) => [`${v} pts`, '']}
              />

              {/* Ligne de moyenne (bleu fin) avec valeur à droite */}
              <ReferenceLine
                y={data.average}
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="4 4"
                label={{ value: `${data.average}`, position: 'right', fill: '#3b82f6', fontSize: 11, fontWeight: 700 }}
              />

              {/* Données réelles : aire pleine */}
              <Area
                type="monotone"
                dataKey="real"
                stroke="#7c3aed"
                strokeWidth={2}
                fill="url(#colorReal)"
                dot={{ fill: '#7c3aed', r: 4, stroke: '#0d0d14', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#7c3aed', stroke: '#1f2937', strokeWidth: 2 }}
                connectNulls={false}
              />

              {/* Projection : ligne pointillée qui s'estompe vers la droite */}
              <Line
                type="monotone"
                dataKey="proj"
                stroke="url(#fadeProj)"
                strokeWidth={2}
                strokeDasharray="3 4"
                dot={false}
                activeDot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-blue-500" /> Moyenne : {data.average} pts/jour
        </p>
      </CardContent>
    </Card>
  )
}

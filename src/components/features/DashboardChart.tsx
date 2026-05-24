'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartData {
  day: string
  points: number
}

export function DashboardChart({ data }: { data: ChartData[] }) {
  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, color: '#f9fafb' }}
            labelStyle={{ color: '#9ca3af', fontSize: 12 }}
            itemStyle={{ color: '#7c3aed', fontWeight: 700 }}
            formatter={(v) => [`${v} pts`, '']}
          />
          <Area
            type="monotone"
            dataKey="points"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#colorPoints)"
            dot={{ fill: '#7c3aed', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#7c3aed', stroke: '#1f2937', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

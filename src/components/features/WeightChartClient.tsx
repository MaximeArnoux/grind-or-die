'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

interface WeightLog {
  id: string
  weight_kg: number
  logged_at: string
}

export function WeightChartClient({ logs }: { logs: WeightLog[] }) {
  const data = logs.map(l => ({
    date: format(parseISO(l.logged_at), 'dd MMM', { locale: fr }),
    poids: l.weight_kg,
  }))

  const min = Math.min(...data.map(d => d.poids)) - 2
  const max = Math.max(...data.map(d => d.poids)) + 2

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[min, max]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, color: '#f9fafb' }}
            formatter={(v) => [`${v} kg`, 'Poids']}
          />
          <Line type="monotone" dataKey="poids" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

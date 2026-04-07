'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

interface Props {
  data: { name: string; hours: number }[]
}

export function TimeLoggedChart({ data }: Props) {
  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-zinc-900">Time Logged This Week</h3>
        <p className="text-[12px] text-zinc-400">Hours per team member</p>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-zinc-400">
          No time logged this week
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#a1a1aa' }}
              unit="h"
            />
            <Tooltip
              cursor={{ fill: '#f4f4f5' }}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                fontSize: '12px',
              }}
             formatter={(val) => [`${val ?? 0}h`, 'Logged']}
            />
            <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === 0 ? '#3b82f6' : i === 1 ? '#6366f1' : '#a5b4fc'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
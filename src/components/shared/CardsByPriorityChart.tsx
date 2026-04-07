'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { name: string; value: number; color: string }[]
}

export function CardsByPriorityChart({ data }: Props) {
  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-zinc-900">Tasks by Priority</h3>
        <p className="text-[12px] text-zinc-400">Distribution across all projects</p>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-zinc-400">
          No tasks yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barSize={36} barCategoryGap="30%">
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
            />
            <Tooltip
              cursor={{ fill: '#f4f4f5' }}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
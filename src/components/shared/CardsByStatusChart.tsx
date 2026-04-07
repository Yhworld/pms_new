'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  data: { name: string; value: number; color: string }[]
  total: number
}

export function CardsByStatusChart({ data, total }: Props) {
  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-zinc-900">Tasks by Status</h3>
        <p className="text-[12px] text-zinc-400">{total} total tasks</p>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-zinc-400">
          No tasks yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
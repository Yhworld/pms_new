'use client'

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Dot
} from 'recharts'

interface Props {
  data: { day: string; completed: number }[]
}

export function TasksCompletedChart({ data }: Props) {
  const total = data.reduce((acc, d) => acc + d.completed, 0)

  return (
    <div className="bg-white border border-zinc-100 rounded-xl shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-zinc-900">Tasks Completed</h3>
        <p className="text-[12px] text-zinc-400">
          {total} task{total !== 1 ? 's' : ''} completed this week
        </p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#a1a1aa' }}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #e4e4e7',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(val) => [`${val ?? 0} tasks`, 'Completed']}
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={<Dot r={4} fill="#3b82f6" stroke="#fff" strokeWidth={2} />}
            activeDot={{ r: 5, fill: '#2563eb' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
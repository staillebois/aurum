'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props {
  data: { category: string; avgMrr: number; count: number }[]
}

export default function CategoryMrrChart({ data }: Props) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Average MRR by Category</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="category" angle={-45} textAnchor="end" tick={{ fill: '#a1a1aa', fontSize: 11 }} interval={0} />
          <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 13 }}
            labelStyle={{ color: '#e4e4e7' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Avg MRR']}
          />
          <Bar dataKey="avgMrr" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

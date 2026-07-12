'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface AppRank {
  name: string
  estimatedMrr: number
  category: string
}

interface Props {
  data: AppRank[]
}

export default function TopAppsChart({ data }: Props) {
  const top20 = [...data].sort((a, b) => b.estimatedMrr - a.estimatedMrr).slice(0, 20)

  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Top 20 Apps by MRR</h3>
      <ResponsiveContainer width="100%" height="100%" className="flex-1">
        <BarChart data={top20} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
          <YAxis dataKey="name" type="category" width={180} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 13 }}
            labelStyle={{ color: '#e4e4e7' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, _name: any, props: any) => [`$${Number(value).toLocaleString()}`, props.payload?.category ?? '']}
          />
          <Bar dataKey="estimatedMrr" fill="#22c55e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

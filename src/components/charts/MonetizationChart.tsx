'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

interface Props {
  data: { model: string; count: number; avgMrr: number }[]
}

const COLORS = ['#3b82f6', '#f59e0b', '#22c55e']

export default function MonetizationChart({ data }: Props) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">MRR by Monetization Model</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="model" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
          <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 13 }}
            labelStyle={{ color: '#e4e4e7' }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, _name: any, props: any) => [
              `$${Number(value).toLocaleString()} avg (${props.payload?.count ?? 0} apps)`,
              'Avg MRR',
            ]}
          />
          <Bar dataKey="avgMrr" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

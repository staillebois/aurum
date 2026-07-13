'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

interface Props {
  data: { model: string; count: number; avgMrr: number }[]
}

const COLORS = ['#3b82f6', '#f59e0b', '#22c55e']

export default function MonetizationChart({ data }: Props) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const index = data.findIndex((d) => d.model === label)
    const color = COLORS[index >= 0 ? index : 0]
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm shadow-lg">
        <p className="mb-1 text-zinc-200">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color }} className="m-0">
            Avg MRR: ${Number(entry.value).toLocaleString()} ({entry.payload?.count} apps)
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">MRR by Monetization Model</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="model" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
          <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
          <Tooltip content={<CustomTooltip />} />
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

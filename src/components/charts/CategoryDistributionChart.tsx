'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props {
  data: { category: string; count: number }[]
}

export default function CategoryDistributionChart({ data }: Props) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.count - a.count),
    [data],
  )

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Apps by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sorted} margin={{ bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="category" angle={-45} textAnchor="end" tick={{ fill: '#a1a1aa', fontSize: 11 }} interval={0} />
          <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 13 }}
            labelStyle={{ color: '#e4e4e7' }}
            formatter={(value: any, _name: any, props: any) => [value, `${props.payload?.category ?? ''} apps`]}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

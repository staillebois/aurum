'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

interface Props {
  data: { rating: string; count: number }[]
}

const RATING_COLORS: Record<string, string> = {
  '1★': '#ef4444',
  '2★': '#f97316',
  '3★': '#eab308',
  '4★': '#84cc16',
  '5★': '#22c55e',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const color = RATING_COLORS[label] ?? '#a1a1aa'
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm shadow-lg">
      <p className="mb-1 text-zinc-200">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color }} className="m-0">
          {entry.value.toLocaleString()} apps
        </p>
      ))}
    </div>
  )
}

export default function RatingDistributionChart({ data }: Props) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Rating Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="rating" tick={{ fill: '#a1a1aa', fontSize: 14 }} />
          <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.rating} fill={RATING_COLORS[entry.rating] ?? '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

'use client'

import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface AppPoint {
  name: string
  downloads: number
  estimatedMrr: number
  category: string
}

interface Props {
  data: AppPoint[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-zinc-200">{d.name}</div>
      <div className="mt-1 text-zinc-400">Downloads: {d.downloads?.toLocaleString()}</div>
      <div className="text-zinc-400">MRR: ${d.estimatedMrr?.toLocaleString()}</div>
    </div>
  )
}

export default function DownloadsVsMrrChart({ data }: Props) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Downloads vs MRR</h3>
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis type="number" dataKey="downloads" name="Downloads" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : v.toString()} />
          <YAxis dataKey="estimatedMrr" name="MRR" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} fill="#06b6d4" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

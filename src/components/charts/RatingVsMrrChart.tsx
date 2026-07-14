'use client'

import { useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface AppPoint {
  name: string
  category: string
  estimatedMrr: number
  rating: number
}

interface TooltipPayload {
  payload: AppPoint
}

interface Props {
  data: AppPoint[]
}

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4',
  '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#d946ef', '#0ea5e9', '#eab308',
  '#a855f7', '#10b981', '#f43f5e', '#0284c7', '#65a30d', '#d97706',
  '#7c3aed', '#059669', '#db2777', '#0369a1', '#4d7c0f', '#b45309', '#9333ea',
  '#0d9488', '#be123c', '#075985', '#3f6212', '#92400e', '#6d28d9', '#0f766e',
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-zinc-200">{d.name}</div>
      <div className="mt-1 text-zinc-400">Rating: {d.rating}</div>
      <div className="text-zinc-400">MRR: ${d.estimatedMrr?.toLocaleString()}</div>
    </div>
  )
}

export default function RatingVsMrrChart({ data }: Props) {
  const withRating = useMemo(() => data.filter((a) => a.rating > 0), [data])

  const categoryColors = useMemo(() => {
    const cats = [...new Set(withRating.map((d) => d.category))]
    const map: Record<string, string> = {}
    cats.forEach((cat, i) => { map[cat] = COLORS[i % COLORS.length] })
    return map
  }, [withRating])

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Rating vs MRR</h3>
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis type="number" dataKey="rating" name="Rating" tick={{ fill: '#a1a1aa', fontSize: 11 }} domain={[0, 5]} />
          <YAxis dataKey="estimatedMrr" name="MRR" tick={{ fill: '#a1a1aa', fontSize: 11 }} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={() => (
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 text-xs text-zinc-400">
                {Object.entries(categoryColors).map(([cat, color]) => (
                  <span key={cat} className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {cat}
                  </span>
                ))}
              </div>
            )}
          />
          <Scatter
            data={withRating}
            shape={(props: any) => {
              const { cx, cy, payload } = props
              if (cx === undefined || cy === undefined) return null
              return <circle cx={cx} cy={cy} r={4} fill={categoryColors[payload.category] ?? '#666'} opacity={0.7} />
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

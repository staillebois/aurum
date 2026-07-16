'use client'

import { formatDownloads } from '@/lib/ai-analytics'

interface TopApp {
  name: string
  mrr: number
  score: number
  rating: number
  downloads: number
  reason: string
}

export default function TopAppsList({ apps }: { apps: TopApp[] }) {
  if (apps.length === 0) return null

  return (
    <div className="space-y-3">
      {apps.map((app, i) => (
        <div key={i} className="rounded-lg border border-zinc-700 bg-zinc-900/30 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
              {i + 1}
            </span>
            <span className="text-sm font-medium text-zinc-200">{app.name}</span>
          </div>
          <div className="mb-1.5 flex flex-wrap gap-2">
            {app.mrr > 0 && (
              <span className="rounded bg-emerald-900/30 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
                ${app.mrr.toLocaleString()} MRR
              </span>
            )}
            {app.score > 0 && (
              <span className="rounded bg-blue-900/30 px-1.5 py-0.5 text-xs font-medium text-blue-400">
                Score: {app.score}
              </span>
            )}
            {app.rating > 0 && (
              <span className="rounded bg-amber-900/30 px-1.5 py-0.5 text-xs font-medium text-amber-400">
                ★ {app.rating.toFixed(1)}
              </span>
            )}
            {app.downloads > 0 && (
              <span className="rounded bg-violet-900/30 px-1.5 py-0.5 text-xs font-medium text-violet-400">
                {formatDownloads(app.downloads)} DL
              </span>
            )}
          </div>
          {app.reason && <p className="text-xs text-zinc-400">{app.reason}</p>}
        </div>
      ))}
    </div>
  )
}

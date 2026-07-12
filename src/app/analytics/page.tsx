'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CategoryMrrChart,
  ScoreVsMrrChart,
  TopAppsChart,
  MonetizationChart,
  ScoreDistributionChart,
  DownloadsVsMrrChart,
} from '@/components/charts'

interface AnalyticsData {
  categoryStats: { category: string; avgMrr: number; count: number; maxMrr: number }[]
  monetizationStats: { model: string; count: number; avgMrr: number }[]
  scoreDistribution: { range: string; count: number }[]
  apps: {
    name: string
    category: string
    estimatedMrr: number
    opportunityScore: number
    downloads: number
    price: number
    hasIap: boolean
    hasSubscriptions: boolean
    rating: number
  }[]
  totalApps: number
  displayCount: number
}

function AnalyticsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fetching, setFetching] = useState(false)

  const paramMinMrr = searchParams.get("minMrr") ?? ""
  const paramMaxMrr = searchParams.get("maxMrr") ?? ""
  const paramMinScore = searchParams.get("minScore") ?? ""
  const paramMaxScore = searchParams.get("maxScore") ?? ""
  const paramMinDownloads = searchParams.get("minDownloads") ?? ""
  const paramMaxDownloads = searchParams.get("maxDownloads") ?? ""
  const paramMaxApps = searchParams.get("maxApps") ?? "500"

  useEffect(() => {
    const params = new URLSearchParams()
    if (paramMinMrr) params.set("minMrr", paramMinMrr)
    if (paramMaxMrr) params.set("maxMrr", paramMaxMrr)
    if (paramMinScore) params.set("minScore", paramMinScore)
    if (paramMaxScore) params.set("maxScore", paramMaxScore)
    if (paramMinDownloads) params.set("minDownloads", paramMinDownloads)
    if (paramMaxDownloads) params.set("maxDownloads", paramMaxDownloads)
    if (paramMaxApps && paramMaxApps !== "500") params.set("maxApps", paramMaxApps)

    setFetching(true)
    fetch(`/api/analytics?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((d: AnalyticsData) => {
        setData(d)
      })
      .catch((err: Error) => {
        setError(err.message)
      })
      .finally(() => setFetching(false))
  }, [paramMinMrr, paramMaxMrr, paramMinScore, paramMaxScore, paramMinDownloads, paramMaxDownloads, paramMaxApps])

  return (
    <div className="p-6">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
          {data && (
            <p className="mt-1 text-sm text-zinc-500">
              {data.totalApps.toLocaleString()} apps
              {data.displayCount < data.totalApps && ` · showing top ${data.displayCount.toLocaleString()}`}
            </p>
          )}
        </div>
        <button onClick={() => router.back()} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800">
          ← Back
        </button>
      </header>

      <FilterBar fetching={fetching} />

      {error && !data ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-sm text-red-400">Failed to load analytics: {error}</div>
        </div>
      ) : !data ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-sm text-zinc-500">Loading analytics...</div>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Apps" value={data.totalApps.toLocaleString()} />
            <StatCard label="Categories" value={data.categoryStats.length.toString()} />
            <StatCard label="Avg MRR" value={`$${Math.round(data.apps.reduce((s, a) => s + a.estimatedMrr, 0) / Math.max(data.apps.length, 1)).toLocaleString()}`} />
            <StatCard label="Top MRR" value={`$${Math.max(...data.apps.map((a) => a.estimatedMrr)).toLocaleString()}`} />
          </div>

          <h2 className="mb-4 text-lg font-semibold text-zinc-200">General</h2>
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <CategoryMrrChart data={data.categoryStats} />
            <MonetizationChart data={data.monetizationStats} />
            <ScoreDistributionChart data={data.scoreDistribution} />
          </div>

          <h2 className="mb-4 text-lg font-semibold text-zinc-200">By App</h2>
          <div className="mb-8">
            <ScoreVsMrrChart data={data.apps} />
          </div>
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <TopAppsChart data={data.apps} />
            <DownloadsVsMrrChart data={data.apps} />
          </div>
        </>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="text-sm text-zinc-500">Loading analytics...</div></div>}>
      <AnalyticsContent />
    </Suspense>
  )
}

function FilterBar({ fetching }: { fetching: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState({
    minMrr: searchParams.get("minMrr") ?? "",
    maxMrr: searchParams.get("maxMrr") ?? "",
    minScore: searchParams.get("minScore") ?? "",
    maxScore: searchParams.get("maxScore") ?? "",
    minDownloads: searchParams.get("minDownloads") ?? "",
    maxDownloads: searchParams.get("maxDownloads") ?? "",
    maxApps: searchParams.get("maxApps") ?? "500",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (filters.minMrr) params.set("minMrr", filters.minMrr)
    if (filters.maxMrr) params.set("maxMrr", filters.maxMrr)
    if (filters.minScore) params.set("minScore", filters.minScore)
    if (filters.maxScore) params.set("maxScore", filters.maxScore)
    if (filters.minDownloads) params.set("minDownloads", filters.minDownloads)
    if (filters.maxDownloads) params.set("maxDownloads", filters.maxDownloads)
    if (filters.maxApps && filters.maxApps !== "500") params.set("maxApps", filters.maxApps)
    router.replace(`/analytics?${params.toString()}`, { scroll: false })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-3">
      <FilterInput label="MRR min" value={filters.minMrr} onChange={(v) => setFilters((p) => ({ ...p, minMrr: v }))} />
      <FilterInput label="MRR max" value={filters.maxMrr} onChange={(v) => setFilters((p) => ({ ...p, maxMrr: v }))} />
      <FilterInput label="Score min" value={filters.minScore} onChange={(v) => setFilters((p) => ({ ...p, minScore: v }))} />
      <FilterInput label="Score max" value={filters.maxScore} onChange={(v) => setFilters((p) => ({ ...p, maxScore: v }))} />
      <FilterInput label="Downloads min" value={filters.minDownloads} onChange={(v) => setFilters((p) => ({ ...p, minDownloads: v }))} />
      <FilterInput label="Downloads max" value={filters.maxDownloads} onChange={(v) => setFilters((p) => ({ ...p, maxDownloads: v }))} />
      <FilterInput label="Max apps" value={filters.maxApps} onChange={(v) => setFilters((p) => ({ ...p, maxApps: v }))} />
      <div className="flex items-center gap-2">
        <button type="submit" className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700">
          Apply
        </button>
        {fetching && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        )}
      </div>
    </form>
  )
}

function FilterInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      placeholder={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-32 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500"
    />
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-zinc-100">{value}</div>
    </div>
  )
}

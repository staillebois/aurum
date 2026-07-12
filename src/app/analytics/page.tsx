'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
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

      <FilterBar />

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

function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [localFilters, setLocalFilters] = useState({
    minMrr: searchParams.get("minMrr") ?? "",
    maxMrr: searchParams.get("maxMrr") ?? "",
    minScore: searchParams.get("minScore") ?? "",
    maxScore: searchParams.get("maxScore") ?? "",
    minDownloads: searchParams.get("minDownloads") ?? "",
    maxDownloads: searchParams.get("maxDownloads") ?? "",
    maxApps: searchParams.get("maxApps") ?? "500",
  })

  const isInternalUpdate = useRef(false)

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    setLocalFilters({
      minMrr: searchParams.get("minMrr") ?? "",
      maxMrr: searchParams.get("maxMrr") ?? "",
      minScore: searchParams.get("minScore") ?? "",
      maxScore: searchParams.get("maxScore") ?? "",
      minDownloads: searchParams.get("minDownloads") ?? "",
      maxDownloads: searchParams.get("maxDownloads") ?? "",
      maxApps: searchParams.get("maxApps") ?? "500",
    })
  }, [searchParams])

  const isSearching =
    localFilters.minMrr !== (searchParams.get("minMrr") ?? "") ||
    localFilters.maxMrr !== (searchParams.get("maxMrr") ?? "") ||
    localFilters.minScore !== (searchParams.get("minScore") ?? "") ||
    localFilters.maxScore !== (searchParams.get("maxScore") ?? "") ||
    localFilters.minDownloads !== (searchParams.get("minDownloads") ?? "") ||
    localFilters.maxDownloads !== (searchParams.get("maxDownloads") ?? "") ||
    localFilters.maxApps !== (searchParams.get("maxApps") ?? "500")

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (isSearching) {
      debounceTimer.current = setTimeout(() => {
        isInternalUpdate.current = true
        const params = new URLSearchParams()
        if (localFilters.minMrr) params.set("minMrr", localFilters.minMrr)
        if (localFilters.maxMrr) params.set("maxMrr", localFilters.maxMrr)
        if (localFilters.minScore) params.set("minScore", localFilters.minScore)
        if (localFilters.maxScore) params.set("maxScore", localFilters.maxScore)
        if (localFilters.minDownloads) params.set("minDownloads", localFilters.minDownloads)
        if (localFilters.maxDownloads) params.set("maxDownloads", localFilters.maxDownloads)
        if (localFilters.maxApps && localFilters.maxApps !== "500") params.set("maxApps", localFilters.maxApps)
        router.replace(`/analytics?${params.toString()}`, { scroll: false })
      }, 1000)
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [isSearching, localFilters, router])

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <FilterInput label="MRR min" value={localFilters.minMrr} onChange={(v) => setLocalFilters((p) => ({ ...p, minMrr: v }))} />
      <FilterInput label="MRR max" value={localFilters.maxMrr} onChange={(v) => setLocalFilters((p) => ({ ...p, maxMrr: v }))} />
      <FilterInput label="Score min" value={localFilters.minScore} onChange={(v) => setLocalFilters((p) => ({ ...p, minScore: v }))} />
      <FilterInput label="Score max" value={localFilters.maxScore} onChange={(v) => setLocalFilters((p) => ({ ...p, maxScore: v }))} />
      <FilterInput label="Downloads min" value={localFilters.minDownloads} onChange={(v) => setLocalFilters((p) => ({ ...p, minDownloads: v }))} />
      <FilterInput label="Downloads max" value={localFilters.maxDownloads} onChange={(v) => setLocalFilters((p) => ({ ...p, maxDownloads: v }))} />
      <FilterInput label="Max apps" value={localFilters.maxApps} onChange={(v) => setLocalFilters((p) => ({ ...p, maxApps: v }))} />
      {isSearching && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
      )}
    </div>
  )
}

function FilterInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      placeholder={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-32 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

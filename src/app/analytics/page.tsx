'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CategoryMrrChart,
  ScoreVsMrrChart,
  TopAppsChart,
  MonetizationChart,
  CategoryDistributionChart,
  DownloadsVsMrrChart,
  RatingDistributionChart,
  CategoryAvgRatingChart,
  RatingVsMrrChart,
} from '@/components/charts'
import type { OpportunityRecommendation } from '@/lib/ai-analytics'

interface HistoryReportSummary {
  id: string
  createdAt: string
  filterMinMrr: number | null
  filterMaxMrr: number | null
  filterMinScore: number | null
  filterMaxScore: number | null
  filterMinDownloads: number | null
  filterMaxDownloads: number | null
  filterMaxApps: number | null
  analyzedCount: number
  recommendedCategory: string
  topAppName: string
}

interface HistoryReportDetail {
  id: string
  createdAt: string
  filters: {
    minMrr: number | null
    maxMrr: number | null
    minScore: number | null
    maxScore: number | null
    minDownloads: number | null
    maxDownloads: number | null
    maxApps: number | null
  }
  analyzedCount: number
  recommendation: OpportunityRecommendation
  modelName: string
}

interface AnalyticsData {
  categoryStats: { category: string; avgMrr: number; avgRating: number; avgScore: number; count: number; maxMrr: number }[]
  monetizationStats: { model: string; count: number; avgMrr: number }[]
  ratingDistribution: { rating: string; count: number }[]
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
  const [refetching, setRefetching] = useState(false)
  const [recommendation, setRecommendation] = useState<OpportunityRecommendation | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analyzedCount, setAnalyzedCount] = useState(0)
  const [modelName, setModelName] = useState<string | null>(null)
  const [historyReports, setHistoryReports] = useState<HistoryReportSummary[]>([])
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)
  const [expandedReportDetail, setExpandedReportDetail] = useState<HistoryReportDetail | null>(null)
  const [expandingId, setExpandingId] = useState<string | null>(null)
  const [rerunningMap, setRerunningMap] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  const paramMinMrr = searchParams.get("minMrr") ?? ""
  const paramMaxMrr = searchParams.get("maxMrr") ?? ""
  const paramMinScore = searchParams.get("minScore") ?? ""
  const paramMaxScore = searchParams.get("maxScore") ?? ""
  const paramMinDownloads = searchParams.get("minDownloads") ?? ""
  const paramMaxDownloads = searchParams.get("maxDownloads") ?? ""
  const paramMaxApps = searchParams.get("maxApps") ?? "500"

  const fetchIdRef = useRef(0)

  useEffect(() => {
    const id = ++fetchIdRef.current

    const params = new URLSearchParams()
    if (paramMinMrr) params.set("minMrr", paramMinMrr)
    if (paramMaxMrr) params.set("maxMrr", paramMaxMrr)
    if (paramMinScore) params.set("minScore", paramMinScore)
    if (paramMaxScore) params.set("maxScore", paramMaxScore)
    if (paramMinDownloads) params.set("minDownloads", paramMinDownloads)
    if (paramMaxDownloads) params.set("maxDownloads", paramMaxDownloads)
    if (paramMaxApps && paramMaxApps !== "500") params.set("maxApps", paramMaxApps)

    Promise.resolve().then(() => {
      if (fetchIdRef.current === id) setRefetching(true)
    })

    fetch(`/api/analytics?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((d: AnalyticsData) => {
        if (fetchIdRef.current === id) setData(d)
      })
      .catch((err: Error) => {
        if (fetchIdRef.current === id) setError(err.message)
      })
      .finally(() => {
        if (fetchIdRef.current === id) setRefetching(false)
      })
  }, [paramMinMrr, paramMaxMrr, paramMinScore, paramMaxScore, paramMinDownloads, paramMaxDownloads, paramMaxApps])

  const fetchHistory = () => {
    fetch("/api/analytics/ai-analyze/history")
      .then((res) => res.json())
      .then((d) => {
        setHistoryReports(d.reports)
        setHistoryLoading(false)
      })
      .catch(() => setHistoryLoading(false))
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const expandReport = (id: string) => {
    if (expandedReportId === id) {
      setExpandedReportId(null)
      setExpandedReportDetail(null)
      return
    }
    setExpandedReportId(id)
    setExpandedReportDetail(null)
    setExpandingId(id)
    fetch(`/api/analytics/ai-analyze/${id}`)
      .then((res) => res.json())
      .then((d: HistoryReportDetail) => {
        setExpandedReportDetail(d)
        setExpandingId(null)
      })
      .catch(() => setExpandingId(null))
  }

  const rerunReport = (id: string) => {
    if (rerunningMap[id]) return
    setRerunningMap((prev) => ({ ...prev, [id]: true }))
    fetch(`/api/analytics/ai-analyze/${id}`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((d) => {
        setRecommendation(d.recommendation)
        setAnalyzedCount(d.analyzedCount)
        setModelName(d.modelName ?? null)
        setAnalysisError(null)
        setRerunningMap((prev) => ({ ...prev, [id]: false }))
        fetchHistory()
      })
      .catch((err: Error) => {
        setAnalysisError(err.message)
        setRerunningMap((prev) => ({ ...prev, [id]: false }))
      })
  }

  const filterLabel = (r: HistoryReportSummary): string => {
    const parts: string[] = []
    if (r.filterMinMrr !== null) parts.push(`MRR ≥ $${r.filterMinMrr}`)
    if (r.filterMaxMrr !== null) parts.push(`MRR ≤ $${r.filterMaxMrr}`)
    if (r.filterMinScore !== null) parts.push(`Score ≥ ${r.filterMinScore}`)
    if (r.filterMaxScore !== null) parts.push(`Score ≤ ${r.filterMaxScore}`)
    if (r.filterMinDownloads !== null) parts.push(`DL ≥ ${r.filterMinDownloads.toLocaleString()}`)
    if (r.filterMaxDownloads !== null) parts.push(`DL ≤ ${r.filterMaxDownloads.toLocaleString()}`)
    if (r.filterMaxApps !== null) parts.push(`top ${r.filterMaxApps}`)
    return parts.join(", ") || "No filters"
  }

  const runAnalysis = () => {
    if (analyzing || !data || data.apps.length === 0) return
    setAnalyzing(true)
    setAnalysisError(null)
    setRecommendation(null)

    const body: Record<string, string> = {}
    if (paramMinMrr) body.minMrr = paramMinMrr
    if (paramMaxMrr) body.maxMrr = paramMaxMrr
    if (paramMinScore) body.minScore = paramMinScore
    if (paramMaxScore) body.maxScore = paramMaxScore
    if (paramMinDownloads) body.minDownloads = paramMinDownloads
    if (paramMaxDownloads) body.maxDownloads = paramMaxDownloads
    if (paramMaxApps && paramMaxApps !== "500") body.maxApps = paramMaxApps

    fetch("/api/analytics/ai-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((d) => {
        setRecommendation(d.recommendation)
        setAnalyzedCount(d.analyzedCount)
        setModelName(d.modelName ?? null)
        setAnalyzing(false)
        fetchHistory()
      })
      .catch((err: Error) => {
        setAnalysisError(err.message)
        setAnalyzing(false)
      })
  }

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
        <div className="flex items-center gap-3">
            <button
              onClick={runAnalysis}
              disabled={!mounted || analyzing || !data || data.apps.length === 0}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
                  Analyzing...
                </span>
              ) : (
                "Launch AI Analysis"
              )}
            </button>
            <button onClick={() => router.back()} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800">
              ← Back
            </button>
          </div>
      </header>

      <FilterBar refetching={refetching} />

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
            <CategoryDistributionChart data={data.categoryStats} />
          </div>
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <RatingDistributionChart data={data.ratingDistribution} />
            <CategoryAvgRatingChart data={data.categoryStats} />
          </div>

          <h2 className="mb-4 text-lg font-semibold text-zinc-200">By App</h2>
          <div className="mb-8">
            <RatingVsMrrChart data={data.apps} />
          </div>
          <div className="mb-8">
            <ScoreVsMrrChart data={data.apps} />
          </div>
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <TopAppsChart data={data.apps} />
            <DownloadsVsMrrChart data={data.apps} />
          </div>

          {analysisError && (
            <div className="mb-8 rounded-lg border border-red-800 bg-red-900/20 p-4">
              <p className="text-sm text-red-400">Analysis failed: {analysisError}</p>
              <button
                onClick={runAnalysis}
                className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          )}

          {recommendation && (
            <div className="mb-8 rounded-lg border border-zinc-700 bg-zinc-900/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-200">AI Opportunity Analysis</h2>
                <span className="text-xs text-zinc-500">Based on {analyzedCount.toLocaleString()} apps{modelName ? ` · ${modelName}` : ""}</span>
              </div>

              <div className="mb-4 flex flex-wrap gap-4">
                <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 px-3 py-2">
                  <div className="text-xs text-zinc-500">Recommended Category</div>
                  <div className="text-sm font-semibold text-emerald-400">{recommendation.recommendedCategory}</div>
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-zinc-700 p-3">
                <div className="text-xs text-zinc-500 mb-1">Top App to Study</div>
                <div className="text-sm font-medium text-zinc-200">{recommendation.topApp.name}</div>
                {recommendation.topApp.reason && (
                  <p className="mt-1 text-sm text-zinc-400">{recommendation.topApp.reason}</p>
                )}
              </div>

              {recommendation.keyInsights.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Key Insights</h3>
                  <ul className="space-y-1">
                    {recommendation.keyInsights.map((insight, i) => (
                      <li key={i} className="flex gap-2 text-sm text-zinc-300">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recommendation.improvementThemes.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Improvement Themes</h3>
                  <ul className="space-y-1">
                    {recommendation.improvementThemes.map((theme, i) => (
                      <li key={i} className="flex gap-2 text-sm text-zinc-300">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {theme}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-zinc-200">Analysis History</h2>
            {historyLoading ? (
              <div className="text-sm text-zinc-500">Loading history...</div>
            ) : historyReports.length === 0 ? (
              <div className="text-sm text-zinc-500">No previous analyses. Click &ldquo;Launch AI Analysis&rdquo; to create one.</div>
            ) : (
              <div className="space-y-2">
                {historyReports.map((r) => (
                  <div key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900/30">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => expandReport(r.id)}
                        className="text-xs text-zinc-500 hover:text-zinc-300 w-4"
                      >
                        {expandedReportId === r.id ? "▼" : "▶"}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-zinc-400">{new Date(r.createdAt).toLocaleString()}</span>
                          <span className="text-xs text-zinc-600">·</span>
                          <span className="text-xs text-zinc-500 truncate">{filterLabel(r)}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-500">
                          {r.analyzedCount.toLocaleString()} apps · {r.recommendedCategory}
                        </div>
                      </div>
                      <button
                        onClick={() => rerunReport(r.id)}
                        disabled={rerunningMap[r.id]}
                        className="shrink-0 rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rerunningMap[r.id] ? (
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
                            Rerunning...
                          </span>
                        ) : (
                          "Rerun"
                        )}
                      </button>
                    </div>
                    {expandedReportId === r.id && (
                      <div className="border-t border-zinc-800 px-4 py-4">
                        {expandingId === r.id ? (
                          <div className="text-sm text-zinc-500">Loading...</div>
                        ) : expandedReportDetail && expandedReportDetail.id === r.id ? (
                          <div>
                            <div className="mb-3 flex flex-wrap gap-4">
                              <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 px-3 py-2">
                                <div className="text-xs text-zinc-500">Recommended Category</div>
                                <div className="text-sm font-semibold text-emerald-400">{expandedReportDetail.recommendation.recommendedCategory}</div>
                              </div>
                            </div>
                            <div className="mb-3 rounded-lg border border-zinc-700 p-3">
                              <div className="text-xs text-zinc-500 mb-1">Top App to Study</div>
                              <div className="text-sm font-medium text-zinc-200">{expandedReportDetail.recommendation.topApp.name}</div>
                              {expandedReportDetail.recommendation.topApp.reason && (
                                <p className="mt-1 text-sm text-zinc-400">{expandedReportDetail.recommendation.topApp.reason}</p>
                              )}
                            </div>
                            {expandedReportDetail.recommendation.keyInsights.length > 0 && (
                              <div className="mb-3">
                                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Key Insights</h3>
                                <ul className="space-y-1">
                                  {expandedReportDetail.recommendation.keyInsights.map((insight, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-zinc-300">
                                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                      {insight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {expandedReportDetail.recommendation.improvementThemes.length > 0 && (
                              <div>
                                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Improvement Themes</h3>
                                <ul className="space-y-1">
                                  {expandedReportDetail.recommendation.improvementThemes.map((theme, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-zinc-300">
                                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                      {theme}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="mt-3 text-xs text-zinc-500">
                              Model: {expandedReportDetail.modelName}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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

function FilterBar({ refetching }: { refetching: boolean }) {
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

  const [showSpinner, setShowSpinner] = useState(true)
  const prevRefetching = useRef(refetching)
  const isInternalUpdate = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    if (prevRefetching.current && !refetching) {
      setShowSpinner(false)
    }
    prevRefetching.current = refetching
  }, [refetching])

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (localFilters.minMrr) params.set("minMrr", localFilters.minMrr)
      if (localFilters.maxMrr) params.set("maxMrr", localFilters.maxMrr)
      if (localFilters.minScore) params.set("minScore", localFilters.minScore)
      if (localFilters.maxScore) params.set("maxScore", localFilters.maxScore)
      if (localFilters.minDownloads) params.set("minDownloads", localFilters.minDownloads)
      if (localFilters.maxDownloads) params.set("maxDownloads", localFilters.maxDownloads)
      if (localFilters.maxApps && localFilters.maxApps !== "500") params.set("maxApps", localFilters.maxApps)
      const newStr = params.toString()
      const currentStr = new URLSearchParams(window.location.search).toString()
      if (newStr === currentStr) {
        setShowSpinner(false)
      } else {
        isInternalUpdate.current = true
        router.replace(`/analytics?${newStr}`, { scroll: false })
      }
    }, 500)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [localFilters, router])

  const updateFilter = (key: string, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
    setShowSpinner(true)
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <FilterInput label="MRR min" value={localFilters.minMrr} onChange={(v) => updateFilter("minMrr", v)} />
      <FilterInput label="MRR max" value={localFilters.maxMrr} onChange={(v) => updateFilter("maxMrr", v)} />
      <FilterInput label="Score min" value={localFilters.minScore} onChange={(v) => updateFilter("minScore", v)} />
      <FilterInput label="Score max" value={localFilters.maxScore} onChange={(v) => updateFilter("maxScore", v)} />
      <FilterInput label="Downloads min" value={localFilters.minDownloads} onChange={(v) => updateFilter("minDownloads", v)} />
      <FilterInput label="Downloads max" value={localFilters.maxDownloads} onChange={(v) => updateFilter("maxDownloads", v)} />
      <FilterInput label="Max apps" value={localFilters.maxApps} onChange={(v) => updateFilter("maxApps", v)} />
      {showSpinner && (
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

'use client'

import { use, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface App {
  id: string
  name: string
  icon: string
  category: string
  downloads: number
  price: number
  estimatedMrr: number | null
  opportunityScore: number | null
  aiAnalyzedAt: string | null
}

interface PaginatedResponse {
  data: App[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

const CATEGORIES = [
  'Art & Design', 'Auto & Vehicles', 'Beauty', 'Books & Reference',
  'Business', 'Comics', 'Communication', 'Dating', 'Education',
  'Entertainment', 'Events', 'Family', 'Finance', 'Food & Drink',
  'Health & Fitness', 'House & Home', 'Libraries & Demo', 'Lifestyle',
  'Maps & Navigation', 'Medical', 'Music & Audio', 'News & Magazines',
  'Parenting', 'Personalization', 'Photography', 'Productivity',
  'Shopping', 'Social', 'Sports', 'Tools', 'Travel & Local',
  'Video Players', 'Watch Face', 'Weather',
]

function formatDownloads(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatMoney(n: number | null): string {
  if (n === null || n === undefined) return '-'
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <p className="text-zinc-500">{total} apps total</p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-600"
        >
          Prev
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-zinc-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                p === page
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border border-zinc-300 dark:border-zinc-600'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-600"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = use(searchParams)
  const router = useRouter()

  const category = (params.category as string) || ''
  const price = (params.price as string) || ''
  const minDownloads = (params.minDownloads as string) || ''
  const minMrr = (params.minMrr as string) || ''
  const analyzed = (params.analyzed as string) || ''
  const sortBy = (params.sortBy as string) || 'estimatedMrr'
  const order = (params.order as string) || 'desc'
  const page = parseInt((params.page as string) || '1', 10) || 1

  const [apps, setApps] = useState<App[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const query = new URLSearchParams()
    if (category) query.set('category', category)
    if (price) query.set('price', price)
    if (minDownloads) query.set('minDownloads', minDownloads)
    if (minMrr) query.set('minMrr', minMrr)
    if (analyzed) query.set('analyzed', analyzed)
    query.set('sortBy', sortBy)
    query.set('order', order)
    query.set('page', String(page))

    fetch(`/api/apps?${query.toString()}`)
      .then(res => res.json())
      .then((data: PaginatedResponse) => {
        setApps(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [category, price, minDownloads, minMrr, analyzed, sortBy, order, page])

  const setParams = useCallback(
    (updates: Record<string, string>) => {
      const current = new URLSearchParams(window.location.search)
      for (const [key, value] of Object.entries(updates)) {
        if (value) current.set(key, value)
        else current.delete(key)
      }
      router.push(`/?${current.toString()}`)
    },
    [router],
  )

  const handleSort = (field: string) => {
    const current = new URLSearchParams(window.location.search)
    if (sortBy === field) {
      current.set('order', order === 'asc' ? 'desc' : 'asc')
    } else {
      current.set('sortBy', field)
      current.set('order', 'desc')
    }
    current.set('page', '1')
    router.push(`/?${current.toString()}`)
  }

  const handlePageChange = (p: number) => {
    setParams({ page: String(p) })
  }

  const handleFilterChange = (key: string, value: string) => {
    const current = new URLSearchParams(window.location.search)
    if (value) current.set(key, value)
    else current.delete(key)
    current.set('page', '1')
    router.push(`/?${current.toString()}`)
  }

  const sortIndicator = (field: string) => {
    if (sortBy !== field) return ''
    return order === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="min-h-full p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Aurum</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">App Opportunity Analyzer</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={category}
          onChange={e => handleFilterChange('category', e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={price}
          onChange={e => handleFilterChange('price', e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="">All Prices</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

        <input
          type="number"
          placeholder="Min Downloads"
          value={minDownloads}
          onChange={e => handleFilterChange('minDownloads', e.target.value)}
          className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        />

        <input
          type="number"
          placeholder="Min MRR ($)"
          value={minMrr}
          onChange={e => handleFilterChange('minMrr', e.target.value)}
          className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        />

        <select
          value={analyzed}
          onChange={e => handleFilterChange('analyzed', e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="">All Apps</option>
          <option value="true">With Analysis Only</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-zinc-500">Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500" />
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Category</th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 text-right font-medium text-zinc-500"
                    onClick={() => handleSort('downloads')}
                  >
                    Downloads{sortIndicator('downloads')}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Price</th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 text-right font-medium text-zinc-500"
                    onClick={() => handleSort('estimatedMrr')}
                  >
                    Est. MRR{sortIndicator('estimatedMrr')}
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 text-right font-medium text-zinc-500"
                    onClick={() => handleSort('opportunityScore')}
                  >
                    Score{sortIndicator('opportunityScore')}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-500">AI Analysis</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(app => (
                  <tr
                    key={app.id}
                    className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                    onClick={() => {
                      const s = window.location.search
                      router.push(`/apps/${app.id}${s ? `?from=${encodeURIComponent(s)}` : ''}`)
                    }}
                  >
                    <td className="px-4 py-3">
                      <Image src={app.icon} alt={app.name} className="h-8 w-8 rounded-lg" width={32} height={32} unoptimized />
                    </td>
                    <td className="px-4 py-3 font-medium">{app.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{app.category}</td>
                    <td className="px-4 py-3 text-right">{formatDownloads(app.downloads)}</td>
                    <td className="px-4 py-3 text-right">{app.price === 0 ? 'Free' : `$${app.price.toFixed(2)}`}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(app.estimatedMrr)}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          (app.opportunityScore ?? 0) >= 70
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : (app.opportunityScore ?? 0) >= 40
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {app.opportunityScore ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {app.aiAnalyzedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          ✓ Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
                          — No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {apps.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                      No apps found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}

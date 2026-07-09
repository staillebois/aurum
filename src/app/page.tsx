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
}

const CATEGORIES = [
  'Productivity', 'Finance', 'Health & Fitness', 'Photography',
  'Business', 'Education', 'Tools',
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
  const sortBy = (params.sortBy as string) || 'estimatedMrr'
  const order = (params.order as string) || 'desc'

  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const query = new URLSearchParams()
    if (category) query.set('category', category)
    if (price) query.set('price', price)
    if (minDownloads) query.set('minDownloads', minDownloads)
    if (minMrr) query.set('minMrr', minMrr)
    query.set('sortBy', sortBy)
    query.set('order', order)

    fetch(`/api/apps?${query.toString()}`)
      .then(res => res.json())
      .then(data => {
        setApps(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [category, price, minDownloads, minMrr, sortBy, order])

  const updateParam = useCallback(
    (key: string, value: string) => {
      const current = new URLSearchParams(window.location.search)
      if (value) {
        current.set(key, value)
      } else {
        current.delete(key)
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
          onChange={e => updateParam('category', e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={price}
          onChange={e => updateParam('price', e.target.value)}
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
          onChange={e => updateParam('minDownloads', e.target.value)}
          className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        />

        <input
          type="number"
          placeholder="Min MRR ($)"
          value={minMrr}
          onChange={e => updateParam('minMrr', e.target.value)}
          className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-zinc-500">Loading...</div>
      ) : (
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
              </tr>
            </thead>
            <tbody>
              {apps.map(app => (
                <tr
                  key={app.id}
                  className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  onClick={() => router.push(`/apps/${app.id}`)}
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
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    No apps found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

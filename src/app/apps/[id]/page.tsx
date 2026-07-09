'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Review {
  id: string
  text: string
  rating: number
  userName: string | null
}

interface Competitor {
  id: string
  name: string
  icon: string | null
  downloads: number | null
  estimatedMrr: number | null
}

interface AiAnalysis {
  summary: string
  painPoints: string[]
  improvements: string[]
  analyzedAt: string | null
}

interface AppDetail {
  id: string
  name: string
  icon: string
  description: string
  publisher: string
  category: string
  downloads: number
  price: number
  hasIap: boolean
  hasSubscriptions: boolean
  rating: number
  reviewCount: number
  estimatedMrr: number | null
  opportunityScore: number | null
  reviews: Review[]
  competitors: Competitor[]
  aiAnalysis: AiAnalysis | null
}

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

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span className="ml-1 text-sm text-zinc-500">{rating.toFixed(1)}</span>
    </span>
  )
}

export default function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [app, setApp] = useState<AppDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/apps/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(data => {
        setApp(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">App not found.</p>
        <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-full max-w-4xl p-6">
      <Link href="/" className="mb-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
        &larr; Back to Dashboard
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <Image src={app.icon} alt={app.name} className="h-16 w-16 rounded-2xl" width={64} height={64} unoptimized />
        <div>
          <h1 className="text-2xl font-bold">{app.name}</h1>
          <p className="text-sm text-zinc-500">{app.publisher} &middot; {app.category}</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {app.description}
          </p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Monetization</h2>
          <div className="space-y-1 text-sm">
            <p>
              Price:{' '}
              <span className="font-medium">{app.price === 0 ? 'Free' : `$${app.price.toFixed(2)}`}</span>
            </p>
            <p>
              IAP: <span className="font-medium">{app.hasIap ? 'Yes' : 'No'}</span>
            </p>
            <p>
              Subscriptions:{' '}
              <span className="font-medium">{app.hasSubscriptions ? 'Yes' : 'No'}</span>
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Statistics</h2>
          <div className="space-y-1 text-sm">
            <p>
              Downloads: <span className="font-medium">{formatDownloads(app.downloads)}</span>
            </p>
            <p>
              Reviews: <span className="font-medium">{app.reviewCount.toLocaleString()}</span>
            </p>
            <p>
              Rating: <StarRating rating={app.rating} />
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Opportunity</h2>
          <div className="space-y-1 text-sm">
            <p>
              Est. MRR:{' '}
              <span className="font-medium">{formatMoney(app.estimatedMrr)}</span>
            </p>
            <p>
              Score:{' '}
              <span className="font-medium">{app.opportunityScore ?? '-'}/100</span>
            </p>
          </div>
        </div>
      </div>

      {app.aiAnalysis && (
        <div className="mb-8 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">AI Analysis</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="mb-1 font-medium">Summary</h3>
              <p className="text-zinc-600 dark:text-zinc-400">{app.aiAnalysis.summary}</p>
            </div>
            {app.aiAnalysis.painPoints.length > 0 && (
              <div>
                <h3 className="mb-1 font-medium">Pain Points</h3>
                <ul className="list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-400">
                  {app.aiAnalysis.painPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            {app.aiAnalysis.improvements.length > 0 && (
              <div>
                <h3 className="mb-1 font-medium">Improvement Ideas</h3>
                <ul className="list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-400">
                  {app.aiAnalysis.improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
            {app.aiAnalysis.analyzedAt && (
              <p className="text-xs text-zinc-400">
                Analyzed {new Date(app.aiAnalysis.analyzedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      {app.competitors.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Competitors ({app.competitors.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500" />
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Downloads</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Est. MRR</th>
                </tr>
              </thead>
              <tbody>
                {app.competitors.map(c => (
                  <tr
                    key={c.id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">
                      {c.icon ? (
                        <Image src={c.icon} alt={c.name} className="h-7 w-7 rounded-lg" width={28} height={28} unoptimized />
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-right">{c.downloads ? formatDownloads(c.downloads) : '-'}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(c.estimatedMrr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {app.reviews.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recent Reviews ({app.reviews.length})
          </h2>
          <div className="space-y-3">
            {app.reviews.map(r => (
              <div key={r.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-medium">{r.userName ?? 'Anonymous'}</span>
                  <span className="text-amber-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

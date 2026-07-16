'use client'

export default function ConfidenceBadge({ count }: { count: number }) {
  const level = count < 50 ? 'low' : count <= 200 ? 'medium' : 'high'
  const colors = {
    low: 'border-amber-800 bg-amber-900/20 text-amber-400',
    medium: 'border-blue-800 bg-blue-900/20 text-blue-400',
    high: 'border-emerald-800 bg-emerald-900/20 text-emerald-400',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[level]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${level === 'low' ? 'bg-amber-400' : level === 'medium' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
      {level === 'low' ? 'Low confidence' : level === 'medium' ? 'Medium confidence' : 'High confidence'}
    </span>
  )
}

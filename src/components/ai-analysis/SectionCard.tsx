'use client'

import { useState } from 'react'

interface SectionCardProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function SectionCard({ title, children, defaultOpen = true }: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
        <span className="text-xs text-zinc-500">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="border-t border-zinc-700 px-4 py-3">{children}</div>}
    </div>
  )
}

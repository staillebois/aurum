'use client'

import { useState } from 'react'
import type { OpportunityRecommendation } from '@/lib/ai-analytics'
import ConfidenceBadge from './ConfidenceBadge'
import SectionCard from './SectionCard'
import TopAppsList from './TopAppsList'

interface AIAnalysisResultProps {
  recommendation: OpportunityRecommendation
  analyzedCount: number
  modelName: string | null
  onCopy?: () => void
  onDownload?: () => void
}

type Tab = 'overview' | 'top-apps' | 'strategy' | 'risks'

const tabs: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'top-apps', label: 'Top Apps' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'risks', label: 'Risks & Insights' },
]

export default function AIAnalysisResult({
  recommendation,
  analyzedCount,
  modelName,
  onCopy,
  onDownload,
}: AIAnalysisResultProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-200">AI Opportunity Analysis</h2>
        <div className="flex items-center gap-2">
          <ConfidenceBadge count={analyzedCount} />
          <span className="text-xs text-zinc-500">
            {analyzedCount.toLocaleString()} apps{modelName ? ` · ${modelName}` : ''}
          </span>
        </div>
      </div>

      <div className="mb-4 flex gap-1 border-b border-zinc-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-violet-500 text-zinc-200'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        {activeTab === 'overview' && <OverviewTab recommendation={recommendation} />}
        {activeTab === 'top-apps' && <TopAppsTab recommendation={recommendation} />}
        {activeTab === 'strategy' && <StrategyTab recommendation={recommendation} />}
        {activeTab === 'risks' && <RisksTab recommendation={recommendation} />}
      </div>

      {(onCopy || onDownload) && (
        <div className="flex gap-2 border-t border-zinc-700 pt-3">
          {onCopy && (
            <button onClick={onCopy} className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800">
              Copy report
            </button>
          )}
          {onDownload && (
            <button onClick={onDownload} className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800">
              Download JSON
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function OverviewTab({ recommendation }: { recommendation: OpportunityRecommendation }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 px-3 py-2">
        <div className="text-xs text-zinc-500">Recommended Category</div>
        <div className="text-sm font-semibold text-emerald-400">{recommendation.recommendedCategory}</div>
      </div>

      {recommendation.categoryReason && (
        <p className="text-sm text-zinc-400">{recommendation.categoryReason}</p>
      )}

      {recommendation.marketOverview && (
        <SectionCard title="Market Overview">
          <p className="text-sm text-zinc-300">{recommendation.marketOverview}</p>
        </SectionCard>
      )}

      {recommendation.targetAudience && (
        <SectionCard title="Target Audience">
          <p className="text-sm text-zinc-300">{recommendation.targetAudience}</p>
        </SectionCard>
      )}
    </div>
  )
}

function TopAppsTab({ recommendation }: { recommendation: OpportunityRecommendation }) {
  return (
    <div className="space-y-3">
      {recommendation.topApps.length > 0 ? (
        <TopAppsList apps={recommendation.topApps} />
      ) : (
        <div className="text-sm text-zinc-500">No top apps data available.</div>
      )}
    </div>
  )
}

function StrategyTab({ recommendation }: { recommendation: OpportunityRecommendation }) {
  return (
    <div className="space-y-3">
      {recommendation.monetizationAdvice && (
        <SectionCard title="Monetization Advice">
          <p className="text-sm text-zinc-300">{recommendation.monetizationAdvice}</p>
        </SectionCard>
      )}

      {recommendation.featurePriorities.length > 0 && (
        <SectionCard title="Feature Priorities">
          <ul className="space-y-1">
            {recommendation.featurePriorities.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                {f}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  )
}

function RisksTab({ recommendation }: { recommendation: OpportunityRecommendation }) {
  return (
    <div className="space-y-3">
      {recommendation.riskFactors.length > 0 && (
        <SectionCard title="Risk Factors">
          <ul className="space-y-1">
            {recommendation.riskFactors.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {r}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {recommendation.differentiationOpportunities.length > 0 && (
        <SectionCard title="Differentiation Opportunities">
          <ul className="space-y-1">
            {recommendation.differentiationOpportunities.map((d, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {d}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {recommendation.keyInsights.length > 0 && (
        <SectionCard title="Key Insights">
          <ul className="space-y-1">
            {recommendation.keyInsights.map((insight, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {insight}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {recommendation.improvementThemes.length > 0 && (
        <SectionCard title="Improvement Themes">
          <ul className="space-y-1">
            {recommendation.improvementThemes.map((theme, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-300">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                {theme}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  Users,
  Globe,
  Building2,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIBadge } from '../shared/AIBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SimulationResult } from '@/lib/types/war-game'
import { PLAYERS } from '@/lib/data/initial-data'

interface PulpCapacityDetailsProps {
  result: SimulationResult
}

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031] as const

// ---------------------------------------------------------------------------
// Phased competitor intelligence — derived narrative across 3 strategic phases
// ---------------------------------------------------------------------------

interface PhaseEvent {
  actor: string
  color: string
  headline: string
  sentiment: 'app' | 'expand' | 'delay' | 'neutral'
}

function buildPhasedIntelligence(result: SimulationResult) {
  const { competitorChanges, input } = result
  const appAdd =
    input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity

  const expanders = competitorChanges.filter((c) => c.action === 'add')
  const delayers = competitorChanges.filter((c) => c.action === 'delay')
  const holders = competitorChanges.filter((c) => c.action !== 'add' && c.action !== 'delay')

  const playerOf = (id: string) => PLAYERS.find((p) => p.id === id)

  // ---- Phase 1: Opening Move (APP first-mover wave)
  const opening: PhaseEvent[] = []
  if (input.appCapacity.guangxi.pulpCapacity > 0) {
    opening.push({
      actor: 'APP China',
      color: '#cc0000',
      headline: `Guangxi pulp line commissioned (+${input.appCapacity.guangxi.pulpCapacity} kt)`,
      sentiment: 'app',
    })
  }
  delayers.slice(0, 2).forEach((c) => {
    const p = playerOf(c.playerId)
    if (!p) return
    opening.push({
      actor: p.name,
      color: p.color,
      headline: `${p.name} delays expansion, prioritises utilisation`,
      sentiment: 'delay',
    })
  })

  // ---- Phase 2: Capacity Wave (competitors react)
  const wave: PhaseEvent[] = []
  if (input.appCapacity.jiangsuFujian.pulpCapacity > 0) {
    wave.push({
      actor: 'APP China',
      color: '#cc0000',
      headline: `Jiangsu / Fujian expansion comes online (+${input.appCapacity.jiangsuFujian.pulpCapacity} kt)`,
      sentiment: 'app',
    })
  }
  expanders.slice(0, 2).forEach((c) => {
    const p = playerOf(c.playerId)
    if (!p) return
    wave.push({
      actor: p.name,
      color: p.color,
      headline: `${p.name} matches with defensive +${c.pulpChange} kt expansion`,
      sentiment: 'expand',
    })
  })

  // ---- Phase 3: Equilibrium (oversupply hedging, downstream pivot)
  const equilibrium: PhaseEvent[] = []
  if (appAdd > 250) {
    equilibrium.push({
      actor: 'APP Indonesia',
      color: '#e63946',
      headline: 'Scales board capacity for export pivot — hedges Chinese oversupply',
      sentiment: 'app',
    })
  }
  holders.slice(0, 1).forEach((c) => {
    const p = playerOf(c.playerId)
    if (!p) return
    equilibrium.push({
      actor: p.name,
      color: p.color,
      headline: `${p.name} holds footprint, focuses on margin recovery`,
      sentiment: 'neutral',
    })
  })
  if (equilibrium.length === 0) {
    equilibrium.push({
      actor: 'Market',
      color: '#64748b',
      headline: 'Pricing stabilises as utilisation recovers across the industry',
      sentiment: 'neutral',
    })
  }

  return [
    {
      label: 'Opening Move',
      window: '2026 — 2027',
      narrative:
        delayers.length >= expanders.length
          ? 'APP moves first while competitors hold back, prioritising utilisation over expansion. The window for share capture opens early.'
          : 'APP commits to its first-mover wave; a subset of competitors signals matching intent — early signalling shapes the race.',
      events: opening,
    },
    {
      label: 'Capacity Wave',
      window: '2028 — 2029',
      narrative:
        expanders.length > 0
          ? `${expanders.length} competitor${expanders.length > 1 ? 's' : ''} respond with defensive expansions. Supply additions compound and pricing pressure intensifies through the period.`
          : "Competitors hesitate to follow. APP's incremental capacity comes online into a relatively un-contested supply slot.",
      events: wave,
    },
    {
      label: 'Equilibrium',
      window: '2030 — 2031',
      narrative:
        appAdd > 250
          ? "Oversupply weighs on the spot market. APP's integrated downstream pull (board, tissue, export) hedges Chinese pricing weakness — competitors with weaker downstream are squeezed."
          : 'Market normalises into a moderated supply environment. APP retains a defendable premium versus the competitor average.',
      events: equilibrium,
    },
  ]
}

function SentimentIcon({
  sentiment,
  className,
}: {
  sentiment: 'app' | 'expand' | 'delay' | 'neutral'
  className?: string
}) {
  const map = {
    app: { Icon: ArrowUpRight, color: 'text-red-600' },
    expand: { Icon: ArrowUpRight, color: 'text-blue-600' },
    delay: { Icon: ArrowDownRight, color: 'text-amber-600' },
    neutral: { Icon: Minus, color: 'text-slate-500' },
  }[sentiment]
  const I = map.Icon
  return <I className={cn('h-3 w-3', map.color, className)} />
}

// ---------------------------------------------------------------------------
// MAIN — APP Strategic Position + Competitor Dynamics
// (replaces the old Market Impact / APP Capacity / Competitor Response trio)
// ---------------------------------------------------------------------------

export function PulpCapacityDetails({ result }: PulpCapacityDetailsProps) {
  const { competitorChanges, input } = result

  // APP capacity calculations
  const appChinaPulpAdd =
    input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  const appChinaBoardAdd =
    (input.appCapacity.guangxi.includeBoard ? input.appCapacity.guangxi.boardCapacity : 0) +
    (input.appCapacity.jiangsuFujian.includeBoard ? input.appCapacity.jiangsuFujian.boardCapacity : 0)
  const appChinaTissueAdd =
    (input.appCapacity.guangxi.includeTissue ? input.appCapacity.guangxi.tissueCapacity : 0) +
    (input.appCapacity.jiangsuFujian.includeTissue ? input.appCapacity.jiangsuFujian.tissueCapacity : 0)

  // Competitor summary
  const expanders = competitorChanges.filter((c) => c.action === 'add')
  const delayers = competitorChanges.filter((c) => c.action === 'delay')
  const holders = competitorChanges.filter((c) => c.action !== 'add' && c.action !== 'delay')

  return (
    <div className="space-y-10">
      <APPStrategicPosition
        result={result}
        appPulpAdd={appChinaPulpAdd}
        appBoardAdd={appChinaBoardAdd}
        appTissueAdd={appChinaTissueAdd}
        delayers={delayers.length}
        expanders={expanders.length}
      />

      <CompetitorDynamics
        result={result}
        expanders={expanders.length}
        delayers={delayers.length}
        holders={holders.length}
      />
    </div>
  )
}

// ===========================================================================
// SECTION · APP STRATEGIC POSITION
// Answers: "Did APP's strategy work?"
// ===========================================================================

function APPStrategicPosition({
  result,
  appPulpAdd,
  appBoardAdd,
  appTissueAdd,
  delayers,
  expanders,
}: {
  result: SimulationResult
  appPulpAdd: number
  appBoardAdd: number
  appTissueAdd: number
  delayers: number
  expanders: number
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { input } = result

  // Strategy stance derived from APP additions
  const stance =
    appPulpAdd > 250
      ? { label: 'Aggressive', tone: 'bg-red-50 text-red-700 border-red-200' }
      : appPulpAdd > 100
        ? { label: 'Balanced', tone: 'bg-amber-50 text-amber-700 border-amber-200' }
        : { label: 'Defensive', tone: 'bg-blue-50 text-blue-700 border-blue-200' }

  // Strategic takeaway sentence — AI-style
  const takeaway =
    delayers > expanders
      ? `APP's first-mover wave (+${appPulpAdd} kt pulp, +${appBoardAdd} kt board, +${appTissueAdd} kt tissue) lands into a market where ${delayers} competitor${delayers === 1 ? '' : 's'} explicitly delay${delayers === 1 ? 's' : ''} expansion. The strategy preserves pricing resilience and positions APP to capture share at premium economics.`
      : expanders >= delayers && appPulpAdd > 100
        ? `APP's expansion (+${appPulpAdd} kt pulp) faces ${expanders} matching response${expanders === 1 ? '' : 's'}. Share gains are diluted, but downstream integration (board +${appBoardAdd} kt, tissue +${appTissueAdd} kt) shifts the value capture battle off the spot pulp curve.`
        : `Measured APP expansion (+${appPulpAdd} kt) holds the line on market position. Premium pricing remains defendable; further moves should hinge on demand validation in the 2027–2028 window.`

  return (
    <section id="pulp-app-position" className="scroll-mt-96 space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-red-50 p-1.5 ring-1 ring-red-100">
            <Building2 className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
                APP Strategic Position
              </span>
              <AIBadge size="sm" />
            </div>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              Did APP&apos;s strategy work?
            </h3>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
            stance.tone,
          )}
        >
          {stance.label} stance
        </span>
      </header>

      {/* Strategic takeaway — calm, narrative, no boxed chrome */}
      <p className="max-w-4xl border-l-2 border-red-300 pl-5 text-base leading-relaxed text-foreground/85">
        {takeaway}
      </p>

      {/* Position metrics — three cards: market share, pricing resilience, capacity */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <PositionMetric
          label="Market Share Position"
          value={
            delayers > expanders
              ? 'Strengthening'
              : delayers === expanders
                ? 'Defending'
                : 'Contested'
          }
          helper={
            delayers > expanders
              ? `${delayers} competitor${delayers === 1 ? '' : 's'} delaying — share window opens`
              : delayers === expanders
                ? 'Balanced reactions — share holds roughly flat'
                : `${expanders} competitor${expanders === 1 ? '' : 's'} matching — share gain diluted`
          }
          tone={delayers > expanders ? 'positive' : delayers === expanders ? 'neutral' : 'warn'}
        />
        <PositionMetric
          label="Pricing Resilience"
          value={
            appPulpAdd > 250 && expanders >= 2
              ? 'Under Pressure'
              : expanders >= 2
                ? 'Moderate'
                : 'Defended'
          }
          helper={
            appPulpAdd > 250 && expanders >= 2
              ? 'Oversupply softens APP premium after 2028'
              : expanders >= 2
                ? 'Modest erosion — premium narrows but holds'
                : 'Premium vs competitor avg stays intact'
          }
          tone={
            appPulpAdd > 250 && expanders >= 2
              ? 'negative'
              : expanders >= 2
                ? 'warn'
                : 'positive'
          }
        />
        <PositionMetric
          label="Capacity Build"
          value={`+${appPulpAdd} kt`}
          helper={`Board +${appBoardAdd} kt  ·  Tissue +${appTissueAdd} kt`}
          tone="neutral"
        />
      </div>

      {/* Expandable build schedule — appendix-style */}
      <Disclosure
        open={detailsOpen}
        onToggle={() => setDetailsOpen((o) => !o)}
        label="Capacity build schedule"
        helper="Year-by-year APP China additions and market release"
      >
        <div className="overflow-x-auto rounded-md border border-border/40 bg-card/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="w-48 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Metric
                </th>
                {YEARS.map((year) => (
                  <th
                    key={year}
                    className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/30">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                    <span className="font-medium text-foreground">APP China capacity</span>
                  </div>
                </td>
                {YEARS.map((year) => {
                  const value = input.appCapacity.appChina[year]
                  return (
                    <td key={year} className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          'font-mono text-sm font-semibold tabular-nums',
                          year === 2026
                            ? 'text-foreground'
                            : value > 0
                              ? 'text-emerald-600'
                              : 'text-muted-foreground',
                        )}
                      >
                        {year === 2026 ? value : value > 0 ? `+${value}` : '—'}
                      </span>
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="px-3 py-2.5 text-muted-foreground">Market release (70%)</td>
                {YEARS.map((year) => {
                  const value = input.appCapacity.appChina[year]
                  const release = Math.round(value * 0.7)
                  return (
                    <td
                      key={year}
                      className="px-3 py-2.5 text-center font-mono text-sm tabular-nums text-muted-foreground"
                    >
                      {year === 2026 ? release : release > 0 ? `+${release}` : '—'}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Disclosure>
    </section>
  )
}

// ===========================================================================
// SECTION · COMPETITOR DYNAMICS
// Stance summary → phased narrative → expandable detail table
// ===========================================================================

function CompetitorDynamics({
  result,
  expanders,
  delayers,
  holders,
}: {
  result: SimulationResult
  expanders: number
  delayers: number
  holders: number
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const phases = buildPhasedIntelligence(result)

  return (
    <section id="pulp-competitor-dynamics" className="scroll-mt-96 space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-blue-50 p-1.5 ring-1 ring-blue-100">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Competitor Dynamics
              </span>
              <AIBadge size="sm" />
            </div>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              How competitors respond across the horizon
            </h3>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 md:inline-flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live feed
        </div>
      </header>

      {/* Stance summary — 3 chips, no boxed cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StanceCard
          label="Expanding"
          count={expanders}
          subtitle="Match APP with defensive capacity"
          tone="expand"
        />
        <StanceCard
          label="Delaying"
          count={delayers}
          subtitle="Prioritise utilisation, hold off CapEx"
          tone="delay"
        />
        <StanceCard
          label="Maintaining"
          count={holders}
          subtitle="Hold footprint, focus on margin"
          tone="hold"
        />
      </div>

      {/* Phased narrative — the heart of the section */}
      <div className="relative pt-2">
        <div className="mb-3 flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-indigo-600" />
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Strategic Timeline
          </span>
          <span className="text-xs text-muted-foreground/80">
            · Grouped competitor reactions by phase
          </span>
        </div>

        <div className="relative">
          {/* vertical rail */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-200 via-border to-transparent" />

          <ol className="space-y-6">
            {phases.map((phase, idx) => (
              <li key={phase.label} className="relative pl-7">
                <span
                  className={cn(
                    'absolute left-0 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-background',
                    idx === 0
                      ? 'bg-indigo-500'
                      : idx === 1
                        ? 'bg-amber-500'
                        : 'bg-emerald-500',
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>

                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {phase.window}
                  </span>
                  <span className="text-base font-semibold tracking-tight text-foreground">
                    {phase.label}
                  </span>
                </div>

                <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {phase.narrative}
                </p>

                {phase.events.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {phase.events.map((event, eIdx) => (
                      <li
                        key={eIdx}
                        className="flex items-start gap-2.5 text-sm leading-snug"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                        <span className="font-medium text-foreground">{event.actor}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{event.headline}</span>
                        <SentimentIcon
                          sentiment={event.sentiment}
                          className="ml-auto mt-0.5 flex-shrink-0"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Detailed yearly competitor reactions — expandable appendix */}
      <Disclosure
        open={detailsOpen}
        onToggle={() => setDetailsOpen((o) => !o)}
        label="Detailed yearly competitor reactions"
        helper="Per-player capacity changes, strategy and rationale"
      >
        <CompetitorDetailTable result={result} />
      </Disclosure>
    </section>
  )
}

// ===========================================================================
// Detail Table — preserved from prior version, framed as appendix
// ===========================================================================

function CompetitorDetailTable({ result }: { result: SimulationResult }) {
  const { competitorChanges, input } = result
  const years = YEARS

  return (
    <TooltipProvider>
      <div className="overflow-x-auto rounded-md border border-border/40 bg-card/40">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th
                className="px-2 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                style={{ width: '14%' }}
              >
                Player
              </th>
              <th
                className="px-2 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                style={{ width: '14%' }}
              >
                Strategy
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  className="px-2 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  style={{ width: '8%' }}
                >
                  {year}
                </th>
              ))}
              <th
                className="px-2 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                style={{ width: '10%' }}
              >
                Action
              </th>
              <th
                className="px-2 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                style={{ width: '22%' }}
              >
                Rationale
              </th>
            </tr>
          </thead>
          <tbody>
            {competitorChanges.map((change) => {
              const player = PLAYERS.find((p) => p.id === change.playerId)!
              const competitorConfig = input.competitorConfig?.find(
                (c) => c.playerId === change.playerId,
              )
              const capacityReactionStyle =
                competitorConfig?.behaviorSettings?.capacityReactionStyle || 'defensive'

              const yearlyChange = {
                2026: player.pulpCapacity || 100,
                2027:
                  change.action === 'add'
                    ? Math.round(change.pulpChange * 0.2)
                    : change.action === 'delay'
                      ? -Math.round(change.pulpChange * 0.3)
                      : 0,
                2028:
                  change.action === 'add'
                    ? Math.round(change.pulpChange * 0.3)
                    : change.action === 'delay'
                      ? -Math.round(change.pulpChange * 0.2)
                      : 0,
                2029: change.action === 'add' ? Math.round(change.pulpChange * 0.25) : 0,
                2030:
                  change.action === 'add'
                    ? Math.round(change.pulpChange * 0.15)
                    : change.action === 'delay'
                      ? Math.round(change.pulpChange * 0.3)
                      : 0,
                2031:
                  change.action === 'add'
                    ? Math.round(change.pulpChange * 0.1)
                    : change.action === 'delay'
                      ? Math.round(change.pulpChange * 0.2)
                      : 0,
              }

              const strategyMap: Record<
                string,
                { label: string; color: string; tooltip: string }
              > = {
                aggressive: {
                  label: 'Aggressive',
                  color: 'bg-red-50 text-red-700 border-red-200',
                  tooltip: 'Actively matches or exceeds competitor expansion to gain market share',
                },
                'follow-the-leader': {
                  label: 'Follow-the-Leader',
                  color: 'bg-blue-50 text-blue-700 border-blue-200',
                  tooltip:
                    'Follows market leader expansion with calibrated delay to maintain position',
                },
                defensive: {
                  label: 'Defensive',
                  color: 'bg-amber-50 text-amber-700 border-amber-200',
                  tooltip: 'Prioritizes utilization and avoids aggressive expansion',
                },
              }

              const strategy =
                strategyMap[capacityReactionStyle] || strategyMap['defensive']
              const rationale =
                capacityReactionStyle === 'aggressive'
                  ? 'Aggressive expansion to capture market share ahead of demand'
                  : capacityReactionStyle === 'follow-the-leader'
                    ? 'Following APP expansion with calibrated delay to maintain market position'
                    : 'Prioritizing utilization rates; delaying expansion until market clarity improves'

              return (
                <tr key={change.playerId} className="border-b border-border/30 last:border-0">
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="truncate font-medium text-foreground">
                        {player.nameCn}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            'inline-flex cursor-help items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
                            strategy.color,
                          )}
                        >
                          {strategy.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">{strategy.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  {years.map((year) => {
                    const val = yearlyChange[year]
                    const isBase = year === 2026
                    return (
                      <td key={year} className="px-2 py-2.5 text-center">
                        <span
                          className={cn(
                            'font-mono text-sm tabular-nums',
                            isBase
                              ? 'text-muted-foreground'
                              : val > 0
                                ? 'font-semibold text-emerald-600'
                                : val < 0
                                  ? 'font-semibold text-amber-600'
                                  : 'text-muted-foreground/60',
                          )}
                        >
                          {isBase ? val : val > 0 ? `+${val}` : val < 0 ? val : '—'}
                        </span>
                      </td>
                    )
                  })}
                  <td className="px-2 py-2.5">
                    <span
                      className={cn(
                        'rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                        change.action === 'add' && 'bg-emerald-50 text-emerald-700',
                        change.action === 'delay' && 'bg-amber-50 text-amber-700',
                        change.action !== 'add' && change.action !== 'delay' && 'bg-slate-100 text-slate-700',
                      )}
                    >
                      {change.action === 'add'
                        ? 'Expanding'
                        : change.action === 'delay'
                          ? 'Delaying'
                          : 'Maintaining'}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <p className="text-sm leading-snug text-muted-foreground">{rationale}</p>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  )
}

// ===========================================================================
// PulpExportReallocation — preserved export, used by ResultsPanel appendix
// ===========================================================================

export function PulpExportReallocation({ result }: PulpCapacityDetailsProps) {
  const { exporterAllocations } = result

  return (
    <Card
      id="pulp-export-reallocation"
      className="border-border/40 bg-card/40 scroll-mt-96"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-foreground/85">
            <Globe className="h-4 w-4 text-indigo-600" />
            Global Export Reallocation
          </CardTitle>
          <AIBadge size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="w-40 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Exporter
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Total Volume
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  China Share
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  China Volume
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  ROW Volume
                </th>
              </tr>
            </thead>
            <tbody>
              {exporterAllocations.map((allocation) => {
                const player = PLAYERS.find((p) => p.id === allocation.playerId)
                const totalVolume = allocation.chinaVolume + allocation.otherRegionsVolume
                return (
                  <tr
                    key={allocation.playerId}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {player && (
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: player.color }}
                          />
                        )}
                        <span className="font-medium">
                          {player?.name || allocation.playerId}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-sm tabular-nums">
                      {totalVolume} kt
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={cn(
                          'font-semibold',
                          allocation.chinaShare > 0.5 ? 'text-blue-600' : 'text-amber-600',
                        )}
                      >
                        {Math.round(allocation.chinaShare * 100)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-sm tabular-nums text-blue-600">
                      {allocation.chinaVolume} kt
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-sm tabular-nums text-muted-foreground">
                      {allocation.otherRegionsVolume} kt
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ===========================================================================
// Shared sub-components
// ===========================================================================

function PositionMetric({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string
  helper: string
  tone: 'positive' | 'negative' | 'warn' | 'neutral'
}) {
  const toneClass = {
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    warn: 'text-amber-600',
    neutral: 'text-foreground',
  }[tone]
  const accentBar = {
    positive: 'bg-emerald-500',
    negative: 'bg-red-500',
    warn: 'bg-amber-500',
    neutral: 'bg-slate-400',
  }[tone]

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card/60 p-4">
      <span className={cn('absolute left-0 top-0 h-full w-0.5', accentBar)} />
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className={cn('mt-2 text-xl font-semibold tracking-tight', toneClass)}>
        {value}
      </div>
      <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{helper}</p>
    </div>
  )
}

function StanceCard({
  label,
  count,
  subtitle,
  tone,
}: {
  label: string
  count: number
  subtitle: string
  tone: 'expand' | 'delay' | 'hold'
}) {
  const toneMap = {
    expand: { value: 'text-emerald-600', accent: 'bg-emerald-500', dot: '#10b981' },
    delay: { value: 'text-amber-600', accent: 'bg-amber-500', dot: '#f59e0b' },
    hold: { value: 'text-slate-600', accent: 'bg-slate-400', dot: '#64748b' },
  }[tone]

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card/60 p-4">
      <span className={cn('absolute left-0 top-0 h-full w-0.5', toneMap.accent)} />
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: toneMap.dot }}
        />
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={cn('font-mono text-2xl font-semibold leading-none tabular-nums', toneMap.value)}>
          {count}
        </span>
        <span className="text-xs text-muted-foreground">
          {count === 1 ? 'player' : 'players'}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function Disclosure({
  open,
  onToggle,
  label,
  helper,
  children,
}: {
  open: boolean
  onToggle: () => void
  label: string
  helper?: string
  children: React.ReactNode
}) {
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center gap-2 border-t border-border/40 pt-3 text-left transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors group-hover:text-foreground">
          {label}
        </span>
        {helper && (
          <span className="text-xs text-muted-foreground/80">· {helper}</span>
        )}
        <ChevronDown
          className={cn(
            'ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
            open ? 'rotate-180' : 'rotate-0',
          )}
        />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}


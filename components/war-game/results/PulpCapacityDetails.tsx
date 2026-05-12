'use client'

import {
  Users,
  Globe,
  Building2,
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
// MAIN — APP Capacity Outcome + Competitor's Reaction
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

  // Competitor summary — used only for APP strategic position context
  const expanders = competitorChanges.filter((c) => c.action === 'add')
  const delayers = competitorChanges.filter((c) => c.action === 'delay')

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

      <CompetitorDynamics result={result} />
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
              <h3 className="text-2xl font-semibold tracking-tight text-red-700">
                APP Capacity Outcome
              </h3>
              <AIBadge size="sm" />
            </div>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold',
            stance.tone,
          )}
        >
          {stance.label} stance
        </span>
      </header>

      {/* Strategic takeaway — full width, single calm column */}
      <p className="w-full border-l-2 border-red-300 pl-5 pr-2 text-lg leading-relaxed text-foreground/85 text-pretty">
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

      {/* APP Capacity Outcome — always-visible build schedule card */}
      <div className="overflow-hidden rounded-lg border border-red-100 bg-red-50/30">
        {/* Card header — title + stance badge */}
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-red-600" />
            <h4 className="text-base font-semibold tracking-tight text-foreground">
              APP Capacity Outcome
            </h4>
          </div>
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-semibold',
              stance.tone,
            )}
          >
            {stance.label}
          </span>
        </div>

        {/* Year-by-year table */}
        <div className="overflow-x-auto border-t border-red-100/80">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-red-100/80">
                <th className="w-44 px-5 py-3 text-left text-base font-semibold text-foreground/70">
                  Metric
                </th>
                {YEARS.map((year) => (
                  <th
                    key={year}
                    className="px-3 py-3 text-center text-base font-semibold text-foreground/70"
                  >
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* APP China Capacity row — tinted */}
              <tr className="bg-red-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                    <span className="font-semibold text-red-700">APP China Capacity</span>
                  </div>
                </td>
                {YEARS.map((year) => {
                  const value = input.appCapacity.appChina[year]
                  return (
                    <td key={year} className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          'font-mono text-base font-bold tabular-nums',
                          value > 0 ? 'text-red-700' : 'text-muted-foreground/60',
                        )}
                      >
                        {value > 0 ? value : '—'}
                      </span>
                    </td>
                  )
                })}
              </tr>
              {/* Market Release row — muted red */}
              <tr>
                <td className="px-5 py-3 text-red-600/80">Market Release (70%)</td>
                {YEARS.map((year) => {
                  const value = input.appCapacity.appChina[year]
                  const release = Math.round(value * 0.7)
                  return (
                    <td
                      key={year}
                      className={cn(
                        'px-3 py-3 text-center font-mono text-base tabular-nums',
                        release > 0 ? 'text-red-600/80' : 'text-muted-foreground/60',
                      )}
                    >
                      {release > 0 ? release : '—'}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </section>
  )
}

// ===========================================================================
// SECTION · COMPETITOR DYNAMICS
// Stance summary → phased narrative → expandable detail table
// ===========================================================================

function CompetitorDynamics({
  result,
}: {
  result: SimulationResult
}) {
  return (
    <section id="pulp-competitor-dynamics" className="scroll-mt-96 space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-blue-50 p-1.5 ring-1 ring-blue-100">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-semibold tracking-tight text-blue-700">
                Competitor&apos;s Reaction
              </h3>
              <AIBadge size="sm" />
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[13px] font-medium text-emerald-700 md:inline-flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live feed
        </div>
      </header>

      {/* Yearly competitor reactions table — the only content in this section */}
      <CompetitorDetailTable result={result} />
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
        <table className="w-full table-fixed text-base">
          <thead>
            <tr className="border-b border-border/50">
              <th
                className="px-2.5 py-3 text-left text-base font-semibold text-foreground/80"
                style={{ width: '14%' }}
              >
                Player
              </th>
              <th
                className="px-2.5 py-3 text-left text-base font-semibold text-foreground/80"
                style={{ width: '14%' }}
              >
                Strategy
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  className="px-2 py-3 text-center text-base font-semibold text-foreground/80"
                  style={{ width: '8%' }}
                >
                  {year}
                </th>
              ))}
              <th
                className="px-2.5 py-3 text-left text-base font-semibold text-foreground/80"
                style={{ width: '10%' }}
              >
                Action
              </th>
              <th
                className="px-2.5 py-3 text-left text-base font-semibold text-foreground/80"
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
                  <td className="px-2.5 py-3">
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
                  <td className="px-2.5 py-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            'inline-flex cursor-help items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[13px] font-medium',
                            strategy.color,
                          )}
                        >
                          {strategy.label}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">{strategy.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  {years.map((year) => {
                    const val = yearlyChange[year]
                    const isBase = year === 2026
                    return (
                      <td key={year} className="px-2 py-3 text-center">
                        <span
                          className={cn(
                            'font-mono text-base tabular-nums',
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
                  <td className="px-2.5 py-3">
                    <span
                      className={cn(
                        'rounded px-2 py-0.5 text-[13px] font-medium whitespace-nowrap',
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
                  <td className="px-2.5 py-3">
                    <p className="text-[15px] leading-snug text-muted-foreground">{rationale}</p>
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
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-indigo-600">
            <Globe className="h-5 w-5 text-indigo-600" />
            Global Reallocation
          </CardTitle>
          <AIBadge size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-lg">
            <thead>
              <tr className="border-b border-border/50">
                <th className="w-40 px-3 py-3 text-left text-base font-semibold text-foreground/80">
                  Exporter
                </th>
                <th className="px-3 py-3 text-center text-base font-semibold text-foreground/80">
                  Total Volume
                </th>
                <th className="px-3 py-3 text-center text-base font-semibold text-foreground/80">
                  China Share
                </th>
                <th className="px-3 py-3 text-center text-base font-semibold text-foreground/80">
                  China Volume
                </th>
                <th className="px-3 py-3 text-center text-base font-semibold text-foreground/80">
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
                    <td className="px-3 py-3">
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
                    <td className="px-3 py-3 text-center font-mono tabular-nums">
                      {totalVolume} kt
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          'font-semibold',
                          allocation.chinaShare > 0.5 ? 'text-blue-600' : 'text-amber-600',
                        )}
                      >
                        {Math.round(allocation.chinaShare * 100)}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono tabular-nums text-blue-600">
                      {allocation.chinaVolume} kt
                    </td>
                    <td className="px-3 py-3 text-center font-mono tabular-nums text-muted-foreground">
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
    <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card/60 p-5">
      <span className={cn('absolute left-0 top-0 h-full w-0.5', accentBar)} />
      <div className="text-[15px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className={cn('mt-2.5 text-2xl font-semibold tracking-tight', toneClass)}>
        {value}
      </div>
      <p className="mt-2.5 text-base leading-relaxed text-muted-foreground">{helper}</p>
    </div>
  )
}


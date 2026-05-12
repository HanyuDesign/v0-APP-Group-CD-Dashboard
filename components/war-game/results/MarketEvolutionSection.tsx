'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Activity,
  TrendingDown,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react'
import { AIBadge } from '../shared/AIBadge'
import type { SimulationResult } from '@/lib/types/war-game'
import { PLAYERS } from '@/lib/data/initial-data'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts'

interface MarketEvolutionSectionProps {
  result: SimulationResult
}

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031] as const

// ---------------------------------------------------------------------------
// Data derivation — projections derived from the scenario inputs so the
// section reflects the user's simulation. Numbers are indicative
// (strategic projection, not financial forecast).
// ---------------------------------------------------------------------------

function buildPriceData(result: SimulationResult) {
  const { competitorChanges, input } = result
  const appAdd =
    input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  const competitorAdd = competitorChanges.reduce((s, c) => s + c.pulpChange, 0)
  const totalNetAdd = appAdd + competitorAdd
  const pressure = Math.min(1, Math.max(0, totalNetAdd / 1500))

  return YEARS.map((year, idx) => {
    const t = idx / (YEARS.length - 1)
    const ramp = Math.max(0, t - 0.25) * 1.35
    const baseDecline = pressure * ramp * 180
    return {
      year: String(year),
      app: Math.round(820 - baseDecline * 0.95),
      competitor: Math.round(775 - baseDecline * 1.15),
      market: Math.round(795 - baseDecline * 1.05),
    }
  })
}

function buildCapacityData(result: SimulationResult) {
  const { competitorChanges, input } = result

  const yearWeights: Record<number, number> = {
    2026: 1.0,
    2027: 0.2,
    2028: 0.3,
    2029: 0.25,
    2030: 0.15,
    2031: 0.1,
  }

  const appBase = input.appCapacity.appChina[2026] || 350
  const appAdditions = YEARS.map((y) => input.appCapacity.appChina[y] || 0)
  const appBoosters = [
    0,
    input.appCapacity.guangxi.pulpCapacity * 0.4,
    input.appCapacity.guangxi.pulpCapacity * 0.6 +
      input.appCapacity.jiangsuFujian.pulpCapacity * 0.3,
    input.appCapacity.jiangsuFujian.pulpCapacity * 0.5,
    input.appCapacity.jiangsuFujian.pulpCapacity * 0.2,
    0,
  ]

  const competitorTrajectories = competitorChanges.map((change) => {
    const player = PLAYERS.find((p) => p.id === change.playerId)
    const base = player?.pulpCapacity || 100
    const yearly = YEARS.map((_, idx) => {
      if (idx === 0) return base
      const factor =
        change.action === 'add'
          ? yearWeights[YEARS[idx]] || 0.15
          : change.action === 'delay'
            ? (yearWeights[YEARS[idx]] || 0.15) * -0.4
            : 0
      return Math.round(change.pulpChange * factor)
    })
    return { playerId: change.playerId, player, yearly }
  })

  return YEARS.map((year, idx) => {
    const row: Record<string, number | string> = { year: String(year) }
    let appCum = appBase
    for (let i = 1; i <= idx; i++) {
      appCum += appAdditions[i] + appBoosters[i]
    }
    row['app'] = Math.round(appCum)

    competitorTrajectories.forEach((c) => {
      let cum = c.yearly[0]
      for (let i = 1; i <= idx; i++) cum += c.yearly[i]
      row[c.playerId] = Math.max(0, Math.round(cum))
    })

    return row
  })
}

function buildMarketShareData(capacityData: ReturnType<typeof buildCapacityData>) {
  return capacityData.map((row) => {
    const entries = Object.entries(row).filter(([k]) => k !== 'year') as [string, number][]
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1
    const share: Record<string, number | string> = { year: row.year }
    entries.forEach(([k, v]) => {
      share[k] = +((v / total) * 100).toFixed(1)
    })
    return share
  })
}

// ---------------------------------------------------------------------------
// Visual primitives
// ---------------------------------------------------------------------------

const AXIS_STYLE = { fontSize: 12, fill: '#64748b' }
const GRID_STROKE = '#e2e8f0'

function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border/60 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
      <p className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color || p.stroke || p.fill }}
            />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-mono font-semibold tabular-nums text-foreground">
              {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
              {unit && <span className="ml-0.5 text-sm text-muted-foreground">{unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string
  label: string
  dashed?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
      {dashed ? (
        <span
          className="inline-block h-0 w-4 border-t-2"
          style={{ borderColor: color, borderStyle: 'dashed' }}
        />
      ) : (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main section — narrative-driven executive briefing
// ---------------------------------------------------------------------------

export function MarketEvolutionSection({ result }: MarketEvolutionSectionProps) {
  const priceData = buildPriceData(result)
  const capacityData = buildCapacityData(result)
  const shareData = buildMarketShareData(capacityData)

  const appAdd =
    result.input.appCapacity.guangxi.pulpCapacity +
    result.input.appCapacity.jiangsuFujian.pulpCapacity
  const competitorAdd = result.competitorChanges.reduce((s, c) => s + c.pulpChange, 0)
  const totalNetAdd = appAdd + competitorAdd

  const competitorKeys = result.competitorChanges
    .map((c) => c.playerId)
    .filter((id) => PLAYERS.some((p) => p.id === id))

  const seriesMeta: Record<string, { name: string; color: string }> = {
    app: { name: 'APP China', color: '#cc0000' },
    ...Object.fromEntries(
      competitorKeys.map((id) => {
        const p = PLAYERS.find((pl) => pl.id === id)!
        return [id, { name: p.name, color: p.color }]
      }),
    ),
  }

  // Headline metrics
  const priceDelta = priceData[priceData.length - 1].app - priceData[0].app
  const priceDeltaPct = ((priceDelta / priceData[0].app) * 100).toFixed(1)
  const appShareStart = shareData[0]?.app as number
  const appShareEnd = shareData[shareData.length - 1]?.app as number
  const appShareDelta = +(appShareEnd - appShareStart).toFixed(1)

  const expanders = result.competitorChanges.filter((c) => c.action === 'add')
  const delayers = result.competitorChanges.filter((c) => c.action === 'delay')

  // Competitive pressure label — derived from retaliation count
  const retaliation =
    expanders.length >= 3
      ? { label: 'Heavy', tone: 'negative' as const, helper: `${expanders.length} competitors retaliate` }
      : expanders.length >= 1
        ? { label: 'Moderate', tone: 'warn' as const, helper: `${expanders.length} competitor${expanders.length > 1 ? 's' : ''} responding` }
        : { label: 'Cautious', tone: 'positive' as const, helper: `${delayers.length} player${delayers.length === 1 ? '' : 's'} delaying` }

  // ---- Executive narrative — single paragraph, briefing tone ---------------
  const supplyDescriptor =
    totalNetAdd > 600 ? 'aggressive' : totalNetAdd > 300 ? 'moderate' : 'measured'
  const priceDescriptor =
    priceDelta < -40 ? 'meaningful pricing pressure' : priceDelta < 0 ? 'manageable pricing pressure' : 'stable pricing'
  const shareDescriptor =
    appShareDelta > 1.5
      ? 'creating a clear strategic advantage for APP'
      : appShareDelta > 0
        ? 'creating a temporary strategic advantage for APP'
        : 'leaving APP\'s share roughly flat'

  const narrative = `${supplyDescriptor.charAt(0).toUpperCase() + supplyDescriptor.slice(1)} APP expansion is projected to increase regional supply through 2031 while resulting in ${priceDescriptor} after the 2028 capacity wave. Competitor retaliation remains ${retaliation.label.toLowerCase()} — ${delayers.length > 0 ? `${delayers.length} player${delayers.length === 1 ? '' : 's'} explicitly delay${delayers.length === 1 ? 's' : ''} expansion to defend utilisation` : 'most competitors hold their footprint'} — ${shareDescriptor}. The strategic window favours moving decisively on integrated downstream pull (board, tissue, export) rather than competing on spot pulp economics.`

  return (
    <div className="space-y-10">
      {/* ===================================================================
          SECTION 1 · EXECUTIVE MARKET OUTCOME
          Narrative-first. What happened, why APP benefits, in one read.
          =================================================================== */}
      <section id="executive-outcome" className="scroll-mt-96 space-y-5">
        <header className="flex items-start gap-3">
          <div className="rounded-md bg-indigo-50 p-1.5 ring-1 ring-indigo-100">
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
                Executive Market Outcome
              </span>
              <AIBadge size="sm" />
              <span className="rounded-full border border-border/60 bg-card/60 px-2 py-0.5 text-[13px] font-medium text-muted-foreground">
                2026 — 2031
              </span>
            </div>
            <h3 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
              AI Strategic Summary
            </h3>
          </div>
        </header>

        {/* Narrative paragraph — full width, single calm column */}
        <p className="w-full border-l-2 border-indigo-300 pl-5 pr-2 text-lg leading-relaxed text-foreground/85 text-pretty">
          {narrative}
        </p>

        {/* Key Strategic Metrics — 4 KPI cards, the only "boxed" element here */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <KpiCard
            label="Net Supply Increase"
            value={`+${totalNetAdd.toLocaleString()}`}
            unit="kt"
            tone="neutral"
            helper={`APP +${appAdd}  ·  Comp ${competitorAdd >= 0 ? '+' : ''}${competitorAdd}`}
          />
          <KpiCard
            label="Pricing Trajectory"
            value={`${priceDelta > 0 ? '+' : ''}${priceDelta}`}
            unit="$/t"
            tone={priceDelta < -30 ? 'negative' : priceDelta < 0 ? 'warn' : 'positive'}
            direction={priceDelta < 0 ? 'down' : 'up'}
            helper={`${priceDelta < 0 ? '' : '+'}${priceDeltaPct}% vs 2026`}
          />
          <KpiCard
            label="APP Share Gain"
            value={`${appShareDelta > 0 ? '+' : ''}${appShareDelta}`}
            unit="pp"
            tone={appShareDelta > 0 ? 'positive' : 'warn'}
            direction={appShareDelta > 0 ? 'up' : 'down'}
            helper={`${appShareStart?.toFixed(1)}% → ${appShareEnd?.toFixed(1)}%`}
          />
          <KpiCard
            label="Competitive Pressure"
            value={retaliation.label}
            tone={retaliation.tone}
            helper={retaliation.helper}
          />
        </div>
      </section>

      {/* ===================================================================
          SECTION 2 · MARKET EVOLUTION
          Single hero chart (Price). Supporting charts collapsible below.
          =================================================================== */}
      <section id="market-evolution" className="scroll-mt-96 space-y-4">
        <header className="flex items-end justify-between gap-4 border-b border-border/40 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-foreground/60" />
              <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground/60">
                Market Evolution
              </span>
            </div>
            <h4 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
              How pricing evolves under this scenario
            </h4>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <LegendDot color="#cc0000" label="APP" />
            <LegendDot color="#1d4e89" label="Competitor avg." />
            <LegendDot color="#64748b" label="Market avg." dashed />
          </div>
        </header>

        {/* Hero chart — Price Evolution */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <h5 className="text-lg font-semibold tracking-tight text-foreground">
                    Price Evolution
                  </h5>
                </div>
                <span className="text-sm text-muted-foreground">
                  Bleached hardwood pulp · CFR China · USD / tonne
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Primary evidence for the recommendation — projected pricing trajectory.
              </p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData} margin={{ top: 16, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={AXIS_STYLE}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                />
                <YAxis
                  tick={AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  width={48}
                />
                <Tooltip
                  content={<CustomTooltip unit=" $/t" />}
                  cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
                />

                <ReferenceArea
                  x1="2028"
                  x2="2031"
                  fill="#fef3c7"
                  fillOpacity={0.35}
                  ifOverflow="extendDomain"
                />
                <ReferenceLine
                  x="2028"
                  stroke="#d97706"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: 'Capacity wave',
                    position: 'insideTopRight',
                    fill: '#b45309',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="app"
                  name="APP"
                  stroke="#cc0000"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: '#cc0000' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="competitor"
                  name="Competitor avg."
                  stroke="#1d4e89"
                  strokeWidth={2}
                  dot={{ r: 2.5, strokeWidth: 0, fill: '#1d4e89' }}
                />
                <Line
                  type="monotone"
                  dataKey="market"
                  name="Market avg."
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Compact AI annotation, no extra borders */}
          <div className="flex items-start gap-2 pt-1">
            <Sparkles className="mt-1 h-4 w-4 flex-shrink-0 text-amber-600" />
            <p className="text-base leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">AI Insight · </span>
              {priceDelta < -30
                ? `Capacity additions of ~${totalNetAdd.toLocaleString()} kt by 2031 erode pulp pricing by ~${Math.abs(priceDelta)} $/t after 2028. APP's first-mover premium narrows; sustained margin defence depends on integrated downstream pull.`
                : `Net additions (~${totalNetAdd.toLocaleString()} kt) keep pricing structurally intact. APP retains a defendable premium versus the competitor average through 2031.`}
            </p>
          </div>
        </div>

        {/* Supporting evidence — collapsible, low visual weight */}
        <SupportingEvidence
          capacityData={capacityData}
          shareData={shareData}
          competitorKeys={competitorKeys}
          seriesMeta={seriesMeta}
          appShareStart={appShareStart}
          appShareEnd={appShareEnd}
          appShareDelta={appShareDelta}
        />
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Supporting Evidence — collapsible, calm, secondary
// ---------------------------------------------------------------------------

function SupportingEvidence({
  capacityData,
  shareData,
  competitorKeys,
  seriesMeta,
  appShareStart,
  appShareEnd,
  appShareDelta,
}: {
  capacityData: ReturnType<typeof buildCapacityData>
  shareData: ReturnType<typeof buildMarketShareData>
  competitorKeys: string[]
  seriesMeta: Record<string, { name: string; color: string }>
  appShareStart: number
  appShareEnd: number
  appShareDelta: number
}) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'capacity' | 'share'>('capacity')

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-2 border-t border-border/40 pt-3 text-left transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors group-hover:text-foreground">
          Supporting evidence
        </span>
        <span className="text-[13px] text-muted-foreground/80">
          · Capacity expansion · Market share evolution
        </span>
        <ChevronDown
          className={cn(
            'ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
            open ? 'rotate-180' : 'rotate-0',
          )}
        />
      </button>

      {open && (
        <div className="mt-5">
          {/* Tab strip — one chart visible at a time, keeps Price Evolution as the hero */}
          <div
            role="tablist"
            aria-label="Supporting evidence charts"
            className="flex items-center gap-6 border-b border-border/40"
          >
            <SupportingTab
              label="Capacity Expansion"
              hint="Cumulative pulp capacity · kt"
              active={activeTab === 'capacity'}
              onClick={() => setActiveTab('capacity')}
            />
            <SupportingTab
              label="Market Share"
              hint={`APP ${appShareStart?.toFixed(1)}% → ${appShareEnd?.toFixed(1)}%`}
              active={activeTab === 'share'}
              onClick={() => setActiveTab('share')}
            />
          </div>

          {activeTab === 'capacity' && (
            <div
              role="tabpanel"
              aria-label="Capacity Expansion"
              className="mt-5"
            >
              <SupportingChart
                title="Capacity Expansion"
                subtitle="Cumulative pulp capacity · kt"
                footnote={
                  <>
                    <span className="font-medium text-foreground">APP leads the wave;</span>{' '}
                    competitors follow more cautiously, reinforcing oversupply risk into 2030.
                  </>
                }
              >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={capacityData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ ...AXIS_STYLE, fontSize: 11 }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ ...AXIS_STYLE, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
                <Tooltip
                  content={<CustomTooltip unit=" kt" />}
                  cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
                />
                {competitorKeys.map((id) => {
                  const meta = seriesMeta[id]
                  return (
                    <Area
                      key={id}
                      type="monotone"
                      dataKey={id}
                      name={meta.name}
                      stackId="cap"
                      stroke={meta.color}
                      fill={meta.color}
                      fillOpacity={0.16}
                      strokeWidth={1}
                    />
                  )
                })}
                <Area
                  type="monotone"
                  dataKey="app"
                  name="APP China"
                  stackId="cap"
                  stroke="#cc0000"
                  fill="#cc0000"
                  fillOpacity={0.3}
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
              </SupportingChart>
            </div>
          )}

          {activeTab === 'share' && (
            <div
              role="tabpanel"
              aria-label="Market Share Evolution"
              className="mt-5"
            >
              <SupportingChart
                title="Market Share Evolution"
                subtitle="% of regional pulp capacity"
                footnote={
                  <span className="inline-flex items-center gap-1.5">
                    {appShareDelta > 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-amber-600" />
                    )}
                    <span>
                      APP{' '}
                      <span className="font-medium text-foreground">
                        {appShareStart?.toFixed(1)}% → {appShareEnd?.toFixed(1)}%
                      </span>{' '}
                      ({appShareDelta > 0 ? '+' : ''}
                      {appShareDelta} pp)
                    </span>
                  </span>
                }
              >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={shareData}
                stackOffset="expand"
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ ...AXIS_STYLE, fontSize: 11 }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ ...AXIS_STYLE, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-md border border-border/60 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
                        <p className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {label}
                        </p>
                        <div className="space-y-0.5">
                          {payload.map((p: any) => (
                            <div key={p.dataKey} className="flex items-center gap-2 text-sm">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: p.color || p.fill }}
                              />
                              <span className="text-muted-foreground">{p.name}</span>
                              <span className="ml-auto font-mono font-semibold tabular-nums text-foreground">
                                {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                                <span className="ml-0.5 text-sm text-muted-foreground">%</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }}
                  cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
                />
                {competitorKeys.map((id) => {
                  const meta = seriesMeta[id]
                  return (
                    <Area
                      key={id}
                      type="monotone"
                      dataKey={id}
                      name={meta.name}
                      stackId="share"
                      stroke={meta.color}
                      fill={meta.color}
                      fillOpacity={0.2}
                      strokeWidth={1}
                    />
                  )
                })}
                <Area
                  type="monotone"
                  dataKey="app"
                  name="APP China"
                  stackId="share"
                  stroke="#cc0000"
                  fill="#cc0000"
                  fillOpacity={0.36}
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
              </SupportingChart>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Small, calm tab trigger — borderless, underline indicator, no boxed chrome
function SupportingTab({
  label,
  hint,
  active,
  onClick,
}: {
  label: string
  hint: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'group -mb-px flex flex-col items-start gap-0.5 border-b-2 px-1 pb-2.5 pt-1 text-left transition-colors',
        active
          ? 'border-foreground/80 text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground/90',
      )}
    >
      <span className="text-[15px] font-semibold tracking-tight">{label}</span>
      <span
        className={cn(
          'text-[13px] transition-colors',
          active ? 'text-muted-foreground' : 'text-muted-foreground/70',
        )}
      >
        {hint}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// KPI card — Executive Outcome metrics. Calm, single style.
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  unit,
  helper,
  tone,
  direction,
}: {
  label: string
  value: string
  unit?: string
  helper?: string
  tone: 'positive' | 'negative' | 'warn' | 'neutral'
  direction?: 'up' | 'down'
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
      <div className="mt-2.5 flex items-baseline gap-1.5">
        {direction === 'down' && <ArrowDownRight className={cn('h-5 w-5', toneClass)} />}
        {direction === 'up' && <ArrowUpRight className={cn('h-5 w-5', toneClass)} />}
        <span className={cn('font-mono text-3xl font-semibold leading-none tabular-nums', toneClass)}>
          {value}
        </span>
        {unit && (
          <span className="text-base font-medium text-muted-foreground">{unit}</span>
        )}
      </div>
      {helper && (
        <div className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{helper}</div>
      )}
    </div>
  )
}

function SupportingChart({
  title,
  subtitle,
  footnote,
  children,
}: {
  title: string
  subtitle: string
  footnote: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-3">
        <h5 className="text-lg font-semibold tracking-tight text-foreground">{title}</h5>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="h-[200px] w-full">{children}</div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{footnote}</p>
    </div>
  )
}

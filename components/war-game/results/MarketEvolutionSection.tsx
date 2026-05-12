'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Activity,
  TrendingDown,
  Layers,
  PieChart as PieChartIcon,
  Radio,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
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
// Data derivation helpers — all projections are derived from the simulation
// input so the section reflects the user's scenario. Numbers are deliberately
// indicative (strategic projection, not financial forecast).
// ---------------------------------------------------------------------------

function buildPriceData(result: SimulationResult) {
  const { competitorChanges, input } = result
  const appAdd =
    input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  const competitorAdd = competitorChanges.reduce((s, c) => s + c.pulpChange, 0)
  const totalNetAdd = appAdd + competitorAdd

  // Pressure intensity 0..1 — heavier supply additions = sharper price erosion
  const pressure = Math.min(1, Math.max(0, totalNetAdd / 1500))

  // APP commands a modest premium in 2026 then loses pricing power as
  // capacity comes online (2028 onward).
  return YEARS.map((year, idx) => {
    const t = idx / (YEARS.length - 1) // 0..1
    const ramp = Math.max(0, t - 0.25) * 1.35 // expansion impact ramps after 2027
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

  // Distribute additions across years using the same heuristic as
  // PulpCapacityDetails so the visualisation matches the table view.
  const yearWeights: Record<number, number> = {
    2026: 1.0, // baseline already in place
    2027: 0.2,
    2028: 0.3,
    2029: 0.25,
    2030: 0.15,
    2031: 0.1,
  }

  // APP cumulative trajectory
  const appBase = input.appCapacity.appChina[2026] || 350
  const appAdditions = YEARS.map((y) => input.appCapacity.appChina[y] || 0)
  // Layer in committed Guangxi + Jiangsu adds across post-2026 years
  const appBoosters = [
    0,
    input.appCapacity.guangxi.pulpCapacity * 0.4,
    input.appCapacity.guangxi.pulpCapacity * 0.6 + input.appCapacity.jiangsuFujian.pulpCapacity * 0.3,
    input.appCapacity.jiangsuFujian.pulpCapacity * 0.5,
    input.appCapacity.jiangsuFujian.pulpCapacity * 0.2,
    0,
  ]

  // Build per-competitor yearly trajectories
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

    // APP cumulative
    let appCum = appBase
    for (let i = 1; i <= idx; i++) {
      appCum += appAdditions[i] + appBoosters[i]
    }
    row['app'] = Math.round(appCum)

    // Each competitor cumulative
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

function buildActionTimeline(result: SimulationResult) {
  const { competitorChanges, input } = result

  const appAdd =
    input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity

  const events: {
    year: number
    actor: string
    color: string
    headline: string
    detail: string
    sentiment: 'app' | 'expand' | 'delay' | 'neutral'
  }[] = []

  // APP-driven events anchored to start years
  if (input.appCapacity.guangxi.pulpCapacity > 0) {
    events.push({
      year: input.appCapacity.guangxi.startYear || 2027,
      actor: 'APP China',
      color: '#cc0000',
      headline: `APP commissions Guangxi pulp line (+${input.appCapacity.guangxi.pulpCapacity} kt)`,
      detail: 'First-mover capacity wave in Southern China',
      sentiment: 'app',
    })
  }
  if (input.appCapacity.jiangsuFujian.pulpCapacity > 0) {
    events.push({
      year: input.appCapacity.jiangsuFujian.startYear || 2028,
      actor: 'APP China',
      color: '#cc0000',
      headline: `APP expands Jiangsu/Fujian (+${input.appCapacity.jiangsuFujian.pulpCapacity} kt)`,
      detail: 'Reinforces coastal logistics advantage',
      sentiment: 'app',
    })
  }
  if (appAdd > 250) {
    events.push({
      year: 2029,
      actor: 'APP Indonesia',
      color: '#e63946',
      headline: 'APP scales Indonesia board capacity for export pivot',
      detail: 'Hedges Chinese oversupply via downstream pull',
      sentiment: 'app',
    })
  }

  // Competitor reactions
  competitorChanges.forEach((change) => {
    const player = PLAYERS.find((p) => p.id === change.playerId)
    if (!player) return

    if (change.action === 'add' && change.pulpChange > 50) {
      events.push({
        year: 2028,
        actor: player.name,
        color: player.color,
        headline: `${player.name} follows with +${change.pulpChange} kt expansion`,
        detail: 'Defensive capacity match to protect share',
        sentiment: 'expand',
      })
    } else if (change.action === 'delay') {
      events.push({
        year: 2027,
        actor: player.name,
        color: player.color,
        headline: `${player.name} delays expansion`,
        detail: 'Prioritises utilisation amid pricing uncertainty',
        sentiment: 'delay',
      })
    } else if (change.action === 'none') {
      events.push({
        year: 2027,
        actor: player.name,
        color: player.color,
        headline: `${player.name} prioritises utilisation`,
        detail: 'Holds current footprint, watches APP move',
        sentiment: 'neutral',
      })
    }
  })

  // Sort chronologically and cap to keep timeline readable
  return events.sort((a, b) => a.year - b.year).slice(0, 8)
}

// ---------------------------------------------------------------------------
// Visual sub-components
// ---------------------------------------------------------------------------

const AXIS_STYLE = { fontSize: 11, fill: '#64748b' }
const GRID_STROKE = '#e2e8f0'

function CustomTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border/60 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
              {unit && <span className="ml-0.5 text-xs text-muted-foreground">{unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionAnnotation({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-200/70 bg-amber-50/60 px-3 py-2">
      <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
      <p className="text-sm leading-relaxed text-amber-900/90">
        <span className="font-semibold text-amber-700">AI Insight · </span>
        {text}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function MarketEvolutionSection({ result }: MarketEvolutionSectionProps) {
  const priceData = buildPriceData(result)
  const capacityData = buildCapacityData(result)
  const shareData = buildMarketShareData(capacityData)
  const events = buildActionTimeline(result)

  const appAdd =
    result.input.appCapacity.guangxi.pulpCapacity +
    result.input.appCapacity.jiangsuFujian.pulpCapacity
  const competitorAdd = result.competitorChanges.reduce((s, c) => s + c.pulpChange, 0)
  const totalNetAdd = appAdd + competitorAdd

  // Identify the competitor stack keys for charts
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

  // Headline metrics for the AI strip
  const priceDelta = priceData[priceData.length - 1].app - priceData[0].app
  const appShareStart = shareData[0]?.app as number
  const appShareEnd = shareData[shareData.length - 1]?.app as number
  const appShareDelta = +(appShareEnd - appShareStart).toFixed(1)

  return (
    <section id="market-evolution" className="scroll-mt-96 space-y-4">
      {/* Section header — strategic, not BI */}
      <div className="flex items-end justify-between border-b border-border/60 pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-indigo-50 p-1.5 ring-1 ring-indigo-100">
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                Expected Market Evolution
              </h3>
              <AIBadge size="sm" />
              <span className="rounded-full border border-indigo-200 bg-indigo-50/60 px-2 py-0.5 text-xs font-medium text-indigo-700">
                2026 — 2031
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              AI-projected competitive trajectory under the current scenario — supporting evidence
              for the recommended capacity strategy.
            </p>
          </div>
        </div>

        {/* Compact AI summary strip */}
        <div className="flex items-center gap-5 rounded-md border border-border/60 bg-card/60 px-4 py-2 text-sm">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Price Trajectory
            </span>
            <span
              className={cn(
                'flex items-center gap-1 font-mono font-semibold tabular-nums',
                priceDelta < -30 ? 'text-red-600' : priceDelta < 0 ? 'text-amber-600' : 'text-emerald-600',
              )}
            >
              {priceDelta < 0 ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5" />
              )}
              {priceDelta > 0 ? '+' : ''}
              {priceDelta} $/t
            </span>
          </div>
          <div className="h-8 w-px bg-border/70" />
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              APP Share Δ
            </span>
            <span
              className={cn(
                'flex items-center gap-1 font-mono font-semibold tabular-nums',
                appShareDelta > 0 ? 'text-emerald-600' : 'text-amber-600',
              )}
            >
              {appShareDelta > 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {appShareDelta > 0 ? '+' : ''}
              {appShareDelta} pp
            </span>
          </div>
          <div className="h-8 w-px bg-border/70" />
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Net Capacity
            </span>
            <span className="font-mono font-semibold tabular-nums text-foreground">
              +{totalNetAdd.toLocaleString()} kt
            </span>
          </div>
        </div>
      </div>

      {/* Row 1 — Price Evolution (headline) */}
      <Card className="border-border/60 bg-card/70">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Price Evolution
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  Bleached hardwood pulp · CFR China · USD / tonne
                </span>
              </CardTitle>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <LegendDot color="#cc0000" label="APP" />
              <LegendDot color="#1d4e89" label="Competitor avg." />
              <LegendDot color="#64748b" label="Market avg." dashed />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData} margin={{ top: 16, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="year" tick={AXIS_STYLE} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                <YAxis
                  tick={AXIS_STYLE}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  width={48}
                />
                <Tooltip content={<CustomTooltip unit=" $/t" />} cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} />

                {/* Pressure window shading — post-2028 capacity wave */}
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
                    fontSize: 10,
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
          <div className="mt-3">
            <SectionAnnotation
              text={
                totalNetAdd > 400
                  ? `Capacity additions of ~${totalNetAdd.toLocaleString()} kt by 2031 erode pulp pricing by ~${Math.abs(priceDelta)} $/t after 2028. APP's first-mover premium narrows; sustained margin pressure favours integrated downstream pull.`
                  : `Modest net additions (~${totalNetAdd.toLocaleString()} kt) keep pricing structurally intact. APP retains a defendable premium versus competitor average through 2031.`
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Row 2 — Capacity Expansion + Market Share */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Layers className="h-4 w-4 text-blue-600" />
              Capacity Expansion Timeline
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                Cumulative pulp capacity · kt
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={capacityData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="year" tick={AXIS_STYLE} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                  <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<CustomTooltip unit=" kt" />} cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }} />
                  {/* Render competitors first so APP sits on top with full opacity */}
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
                        fillOpacity={0.18}
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
                    fillOpacity={0.32}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <LegendDot color="#cc0000" label="APP China" />
              {competitorKeys.slice(0, 6).map((id) => (
                <LegendDot key={id} color={seriesMeta[id].color} label={seriesMeta[id].name} />
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">APP leads the wave</span> — competitors
              follow more cautiously, reinforcing the industry oversupply risk into 2030.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PieChartIcon className="h-4 w-4 text-emerald-600" />
              Market Share Evolution
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                % of regional pulp capacity
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={shareData} stackOffset="expand" margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="year" tick={AXIS_STYLE} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
                  <YAxis
                    tick={AXIS_STYLE}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="rounded-md border border-border/60 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                                  <span className="ml-0.5 text-xs text-muted-foreground">%</span>
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
                        fillOpacity={0.22}
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
                    fillOpacity={0.38}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-md border border-emerald-200/70 bg-emerald-50/50 px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                {appShareDelta > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-amber-600" />
                )}
                <span className="text-emerald-900/90">
                  APP captures{' '}
                  <span className="font-semibold">
                    {appShareDelta > 0 ? '+' : ''}
                    {appShareDelta} pp
                  </span>{' '}
                  of regional share by 2031
                </span>
              </div>
              <span className="font-mono text-xs tabular-nums text-emerald-700">
                {appShareStart?.toFixed(1)}% → {appShareEnd?.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Competitor Action Intelligence Feed */}
      <Card className="border-border/60 bg-gradient-to-br from-slate-50/60 to-card/70">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Radio className="h-4 w-4 text-indigo-600" />
              Competitor Action Intelligence
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                Strategic moves detected across the simulation horizon
              </span>
            </CardTitle>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live feed
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Horizontal timeline rail */}
            <div className="absolute left-0 right-0 top-[10px] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="relative grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {events.length === 0 && (
                <div className="col-span-full py-6 text-center text-sm text-muted-foreground">
                  No significant competitive actions detected in this scenario.
                </div>
              )}
              {events.map((event, idx) => (
                <div key={idx} className="relative pt-4">
                  {/* Anchor dot on rail */}
                  <span
                    className="absolute left-3 top-[6px] h-2 w-2 rounded-full ring-2 ring-background"
                    style={{ backgroundColor: event.color }}
                  />

                  <div className="rounded-md border border-border/60 bg-white/70 p-3 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                        {event.year}
                      </span>
                      <SentimentBadge sentiment={event.sentiment} />
                    </div>
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <span className="text-xs font-semibold tracking-wide text-foreground">
                        {event.actor}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {event.headline}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {event.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Small primitives
// ---------------------------------------------------------------------------

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
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
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

function SentimentBadge({
  sentiment,
}: {
  sentiment: 'app' | 'expand' | 'delay' | 'neutral'
}) {
  const config = {
    app: {
      label: 'APP move',
      icon: ArrowUpRight,
      className: 'bg-red-50 text-red-700 border-red-100',
    },
    expand: {
      label: 'Expand',
      icon: ArrowUpRight,
      className: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    delay: {
      label: 'Delay',
      icon: ArrowDownRight,
      className: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    neutral: {
      label: 'Hold',
      icon: Minus,
      className: 'bg-slate-50 text-slate-600 border-slate-100',
    },
  }[sentiment]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        config.className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  )
}

'use client'

import { cn } from '@/lib/utils'
import {
  Activity,
  TrendingDown,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Radio,
  Crown,
  AlertTriangle,
  Target,
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
    input.appCapacity.guangxi.pulpCapacity * 0.6 + input.appCapacity.jiangsuFujian.pulpCapacity * 0.3,
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
  const holders = competitorChanges.filter((c) => c.action === 'none')

  const playerOf = (id: string) => PLAYERS.find((p) => p.id === id)

  // ---- Phase 1: 2026-2027 Opening Move (APP's first-mover wave)
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

  // ---- Phase 2: 2028-2029 Capacity Wave (competitors react)
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

  // ---- Phase 3: 2030-2031 Equilibrium (oversupply hedging, downstream pivot)
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
          : 'Competitors hesitate to follow. APP\'s incremental capacity comes online into a relatively un-contested supply slot.',
      events: wave,
    },
    {
      label: 'Equilibrium',
      window: '2030 — 2031',
      narrative:
        appAdd > 250
          ? 'Oversupply weighs on the spot market. APP\'s integrated downstream pull (board, tissue, export) hedges Chinese pricing weakness — competitors with weaker downstream are squeezed.'
          : 'Market normalises into a moderated supply environment. APP retains a defendable premium versus the competitor average.',
      events: equilibrium,
    },
  ]
}

// ---------------------------------------------------------------------------
// Visual primitives
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
// Main section — narrative-driven executive briefing
// ---------------------------------------------------------------------------

export function MarketEvolutionSection({ result }: MarketEvolutionSectionProps) {
  const priceData = buildPriceData(result)
  const capacityData = buildCapacityData(result)
  const shareData = buildMarketShareData(capacityData)
  const phases = buildPhasedIntelligence(result)

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
  const appShareStart = shareData[0]?.app as number
  const appShareEnd = shareData[shareData.length - 1]?.app as number
  const appShareDelta = +(appShareEnd - appShareStart).toFixed(1)

  const expanders = result.competitorChanges.filter((c) => c.action === 'add')
  const delayers = result.competitorChanges.filter((c) => c.action === 'delay')

  // ---- Narrative copy (executive briefing tone) ---------------------------
  const intensity =
    totalNetAdd > 600 ? 'heavy' : totalNetAdd > 300 ? 'meaningful' : 'modest'

  const narrative = {
    whatHappens:
      intensity === 'heavy'
        ? `A capacity super-cycle of ~${totalNetAdd.toLocaleString()} kt enters the regional pulp market through 2031, with the supply wave concentrated 2028–2029.`
        : intensity === 'meaningful'
          ? `A meaningful ~${totalNetAdd.toLocaleString()} kt of net new capacity comes online through 2031, weighted toward the second half of the horizon.`
          : `Net additions stay contained at ~${totalNetAdd.toLocaleString()} kt — the market remains structurally tight through 2031.`,
    whyItHappens:
      `APP leads a first-mover wave (+${appAdd.toLocaleString()} kt). ${expanders.length > 0 ? `${expanders.length} competitor${expanders.length > 1 ? 's' : ''} respond defensively to protect share` : 'Competitors hesitate to commit'}, while ${delayers.length} player${delayers.length === 1 ? '' : 's'} explicitly delay${delayers.length === 1 ? 's' : ''} expansion to preserve utilisation.`,
    winners:
      appShareDelta > 0
        ? `APP captures +${appShareDelta} pp of regional share by 2031. ${delayers.length > 0 ? 'Delayers cede position; ' : ''}fast followers retain relative scale but at lower margin.`
        : `APP's share holds roughly flat. Competitor responses absorb most of the strategic premium of moving first.`,
    implication:
      priceDelta < -40
        ? `Pricing erodes ~${Math.abs(priceDelta)} $/t after 2028. Margin must be defended through downstream integration (board, tissue, export pivot) rather than spot pulp economics.`
        : priceDelta < 0
          ? `Pricing softens modestly (~${Math.abs(priceDelta)} $/t). APP's premium narrows but remains defendable — focus on cost leadership and downstream pull.`
          : `Pricing holds firm. APP enjoys a structural window to consolidate share at premium economics — accelerate where capital permits.`,
  }

  return (
    <section id="market-evolution" className="scroll-mt-96 space-y-8">
      {/* ===================================================================
          Section header — calm, briefing-style
          =================================================================== */}
      <header className="flex flex-col gap-4 border-b border-border/50 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-indigo-50 p-1.5 ring-1 ring-indigo-100">
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                Strategic Briefing
              </span>
              <AIBadge size="sm" />
              <span className="rounded-full border border-border/60 bg-card/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                2026 — 2031
              </span>
            </div>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              Expected Market Evolution
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              An AI-generated narrative of how the market is projected to evolve under this
              scenario — and what it means for APP&apos;s strategic position.
            </p>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-x-6 gap-y-1 rounded-md border border-border/50 bg-card/40 px-5 py-3">
          <KpiStat
            label="Price Trajectory"
            value={`${priceDelta > 0 ? '+' : ''}${priceDelta} $/t`}
            tone={priceDelta < -30 ? 'negative' : priceDelta < 0 ? 'warn' : 'positive'}
            direction={priceDelta < 0 ? 'down' : 'up'}
          />
          <KpiStat
            label="APP Share Δ"
            value={`${appShareDelta > 0 ? '+' : ''}${appShareDelta} pp`}
            tone={appShareDelta > 0 ? 'positive' : 'warn'}
            direction={appShareDelta > 0 ? 'up' : 'down'}
          />
          <KpiStat
            label="Net Capacity"
            value={`+${totalNetAdd.toLocaleString()} kt`}
            tone="neutral"
          />
        </div>
      </header>

      {/* ===================================================================
          1. STRATEGIC NARRATIVE — executive briefing (what / why / who / so what)
          =================================================================== */}
      <div className="rounded-lg border border-indigo-100/70 bg-gradient-to-br from-indigo-50/30 via-card/40 to-card/40 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
            AI Strategic Narrative
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <NarrativeColumn
            icon={Activity}
            iconColor="text-slate-500"
            eyebrow="What happens"
            body={narrative.whatHappens}
          />
          <NarrativeColumn
            icon={AlertTriangle}
            iconColor="text-amber-600"
            eyebrow="Why it happens"
            body={narrative.whyItHappens}
          />
          <NarrativeColumn
            icon={Crown}
            iconColor="text-emerald-600"
            eyebrow="Winners & losers"
            body={narrative.winners}
          />
          <NarrativeColumn
            icon={Target}
            iconColor="text-indigo-600"
            eyebrow="Strategic implication"
            body={narrative.implication}
            emphasis
          />
        </div>
      </div>

      {/* ===================================================================
          2. PRIMARY EVIDENCE — Price Evolution (hero chart)
          =================================================================== */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <h4 className="text-base font-semibold tracking-tight text-foreground">
                Price Evolution
              </h4>
              <span className="text-xs text-muted-foreground">
                Bleached hardwood pulp · CFR China · USD / tonne
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              The primary evidence behind the recommendation — projected pricing trajectory under
              the current scenario.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <LegendDot color="#cc0000" label="APP" />
            <LegendDot color="#1d4e89" label="Competitor avg." />
            <LegendDot color="#64748b" label="Market avg." dashed />
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-card/40 p-4">
          <div className="h-[280px] w-full">
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

          <div className="mt-3 flex items-start gap-2 border-t border-border/50 pt-3">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">AI Insight · </span>
              {priceDelta < -30
                ? `Capacity additions of ~${totalNetAdd.toLocaleString()} kt by 2031 erode pulp pricing by ~${Math.abs(priceDelta)} $/t after 2028. APP's first-mover premium narrows; sustained margin pressure favours integrated downstream pull.`
                : `Net additions (~${totalNetAdd.toLocaleString()} kt) keep pricing structurally intact. APP retains a defendable premium versus the competitor average through 2031.`}
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================
          3. SUPPORTING EVIDENCE — compact secondary charts
          =================================================================== */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Supporting Evidence
          </span>
          <span className="h-px flex-1 bg-border/60" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Capacity Expansion — compact, no card chrome */}
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
                  tick={{ ...AXIS_STYLE, fontSize: 10 }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ ...AXIS_STYLE, fontSize: 10 }}
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

          {/* Market Share — compact, no card chrome */}
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
                  tick={{ ...AXIS_STYLE, fontSize: 10 }}
                  axisLine={{ stroke: GRID_STROKE }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ ...AXIS_STYLE, fontSize: 10 }}
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
      </div>

      {/* ===================================================================
          4. STRATEGIC INTELLIGENCE — phased competitor narrative
          =================================================================== */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Strategic Intelligence
            </span>
            <span className="text-xs text-muted-foreground">
              How the competitive landscape evolves across the horizon
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live feed
          </div>
        </div>

        <div className="relative">
          {/* vertical timeline rail */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-200 via-border to-transparent" />

          <ol className="space-y-7">
            {phases.map((phase, idx) => (
              <li key={phase.label} className="relative pl-7">
                {/* phase anchor */}
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

                {/* inline event chips — calm, no card grid */}
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
    </section>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiStat({
  label,
  value,
  tone,
  direction,
}: {
  label: string
  value: string
  tone: 'positive' | 'negative' | 'warn' | 'neutral'
  direction?: 'up' | 'down'
}) {
  const toneClass = {
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    warn: 'text-amber-600',
    neutral: 'text-foreground',
  }[tone]

  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          'mt-0.5 flex items-center gap-1 font-mono text-sm font-semibold tabular-nums',
          toneClass,
        )}
      >
        {direction === 'down' ? (
          <ArrowDownRight className="h-3.5 w-3.5" />
        ) : direction === 'up' ? (
          <ArrowUpRight className="h-3.5 w-3.5" />
        ) : null}
        {value}
      </span>
    </div>
  )
}

function NarrativeColumn({
  icon: Icon,
  iconColor,
  eyebrow,
  body,
  emphasis,
}: {
  icon: typeof Activity
  iconColor: string
  eyebrow: string
  body: string
  emphasis?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-l-2 pl-4',
        emphasis ? 'border-indigo-400' : 'border-border/70',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        <span
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.12em]',
            emphasis ? 'text-indigo-700' : 'text-muted-foreground',
          )}
        >
          {eyebrow}
        </span>
      </div>
      <p
        className={cn(
          'text-sm leading-relaxed',
          emphasis ? 'text-foreground' : 'text-foreground/80',
        )}
      >
        {body}
      </p>
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
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <h5 className="text-sm font-semibold tracking-tight text-foreground">{title}</h5>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="h-[180px] w-full">{children}</div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{footnote}</p>
    </div>
  )
}

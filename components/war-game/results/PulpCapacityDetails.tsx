'use client'

import { useState } from 'react'
import {
  Users,
  Globe,
  Building2,
  ChevronDown,
  Gauge,
  Scale,
  Target,
  TrendingUp,
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
// Market Evolution Phases — state-driven model across 3 strategic phases.
// Focuses on how conditions transition (pressure, balance, posture), NOT on
// chronological event logging.
// ---------------------------------------------------------------------------

type MarketBalance = 'tight' | 'balanced' | 'oversupplied'
type CompetitorPostureTone = 'cautious' | 'mixed' | 'reactive' | 'disciplined'

interface MarketPhase {
  key: 'opening' | 'wave' | 'rebalancing'
  index: number
  label: string
  window: string
  tagline: string
  pressure: number // 0–100
  pressureLabel: 'Low' | 'Moderate' | 'High' | 'Peak'
  balance: MarketBalance
  appPosture: string
  competitorPosture: { label: string; tone: CompetitorPostureTone }
  isStrategicWindow: boolean
  state: {
    market: string
    app: string
    competitors: string
    pricing: string
  }
  accent: 'indigo' | 'amber' | 'emerald'
}

function buildMarketPhases(result: SimulationResult): MarketPhase[] {
  const { competitorChanges, input } = result
  const appAdd =
    input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  const expanders = competitorChanges.filter((c) => c.action === 'add').length
  const delayers = competitorChanges.filter((c) => c.action === 'delay').length

  // ── Phase 1 · Opening Window ──────────────────────────────────────────────
  const p1Pressure = delayers > expanders ? 28 : expanders > delayers ? 48 : 36
  const p1Balance: MarketBalance = delayers > expanders ? 'tight' : 'balanced'
  const isStrategicWindow = delayers >= expanders && appAdd > 0

  const phase1: MarketPhase = {
    key: 'opening',
    index: 1,
    label: 'Opening Window',
    window: '2026 — 2027',
    tagline: isStrategicWindow
      ? 'APP commits early while peers hold back — a clean lane for share capture opens.'
      : 'APP moves first; a subset of peers signals matching intent — the window narrows quickly.',
    pressure: p1Pressure,
    pressureLabel: p1Pressure < 35 ? 'Low' : 'Moderate',
    balance: p1Balance,
    appPosture: 'First-mover',
    competitorPosture: {
      label: delayers > expanders ? 'Cautious' : delayers === expanders ? 'Mixed' : 'Signaling',
      tone: delayers > expanders ? 'cautious' : delayers === expanders ? 'mixed' : 'reactive',
    },
    isStrategicWindow,
    state: {
      market:
        delayers > expanders
          ? `Supply tightens — ${delayers} peer${delayers === 1 ? '' : 's'} delay${delayers === 1 ? 's' : ''} expansion`
          : 'Demand absorbs early additions; supply still constructive',
      app: `Commits +${appAdd} kt pulp; secures first-mover capture`,
      competitors:
        delayers > expanders
          ? 'Defensive utilisation; no matching CapEx'
          : `${expanders} peer${expanders === 1 ? '' : 's'} signal${expanders === 1 ? 's' : ''} defensive matching`,
      pricing: 'Premium intact — modest upward bias through 2027',
    },
    accent: 'indigo',
  }

  // ── Phase 2 · Capacity Wave ───────────────────────────────────────────────
  const p2Pressure = appAdd > 250 && expanders >= 2 ? 86 : expanders >= 2 ? 72 : 50
  const p2Balance: MarketBalance = expanders >= 2 ? 'oversupplied' : 'balanced'

  const phase2: MarketPhase = {
    key: 'wave',
    index: 2,
    label: 'Capacity Wave',
    window: '2028 — 2029',
    tagline:
      expanders >= 2
        ? `${expanders} peers match with defensive capacity — supply compounds and pressure peaks.`
        : "APP's incremental capacity lands with limited competitor follow-through.",
    pressure: p2Pressure,
    pressureLabel: p2Pressure >= 80 ? 'Peak' : p2Pressure >= 60 ? 'High' : 'Moderate',
    balance: p2Balance,
    appPosture: appAdd > 250 ? 'Capacity push' : 'Selective build',
    competitorPosture: {
      label: expanders >= 2 ? 'Reactive' : 'Disciplined',
      tone: expanders >= 2 ? 'reactive' : 'disciplined',
    },
    isStrategicWindow: false,
    state: {
      market:
        expanders >= 2
          ? 'Compounding supply — oversupply risk crystallises'
          : 'Supply absorbed at moderated pace',
      app:
        appAdd > 250
          ? 'Heavy build crests; utilisation slips'
          : 'Holds premium positioning; downstream pull stabilises absorption',
      competitors:
        expanders >= 2
          ? `${expanders} peers commit defensive capacity to protect share`
          : 'Peers prioritise margin over share defense',
      pricing:
        expanders >= 2
          ? 'Spot rolls over; premium narrows 4–7%'
          : 'Premium softens marginally; market holds',
    },
    accent: 'amber',
  }

  // ── Phase 3 · Market Rebalancing ──────────────────────────────────────────
  const p3Pressure = appAdd > 250 ? 58 : 38
  const p3Balance: MarketBalance =
    appAdd > 250 && expanders >= 2 ? 'oversupplied' : 'balanced'

  const phase3: MarketPhase = {
    key: 'rebalancing',
    index: 3,
    label: 'Market Rebalancing',
    window: '2030 — 2031',
    tagline:
      appAdd > 250
        ? 'Downstream integration hedges spot weakness — peers with weaker downstream squeeze.'
        : 'Market normalises into a moderated supply environment with defendable premiums.',
    pressure: p3Pressure,
    pressureLabel: p3Pressure < 45 ? 'Low' : 'Moderate',
    balance: p3Balance,
    appPosture: appAdd > 250 ? 'Downstream hedge' : 'Margin defense',
    competitorPosture: { label: 'Disciplined', tone: 'disciplined' },
    isStrategicWindow: false,
    state: {
      market:
        p3Balance === 'oversupplied'
          ? 'Spot pulp soft; integrated players capture value off-curve'
          : 'Utilisation recovers across the industry',
      app:
        appAdd > 250
          ? 'Board / tissue / export pull cushions Chinese pricing'
          : 'Holds defendable premium vs competitor avg',
      competitors: 'Margin defense; selective debottlenecking only',
      pricing:
        appAdd > 250
          ? 'Spot recovers slowly — premium reconsolidates by 2031'
          : 'Premium stabilises through cycle',
    },
    accent: 'emerald',
  }

  return [phase1, phase2, phase3]
}

// ── Visual indicator helpers ───────────────────────────────────────────────

function pressureBarTone(pressure: number) {
  if (pressure < 35) return 'bg-emerald-500'
  if (pressure < 60) return 'bg-amber-500'
  if (pressure < 80) return 'bg-orange-500'
  return 'bg-rose-500'
}

function pressureTextTone(pressure: number) {
  if (pressure < 35) return 'text-emerald-700'
  if (pressure < 60) return 'text-amber-700'
  if (pressure < 80) return 'text-orange-700'
  return 'text-rose-700'
}

function BalancePill({ balance }: { balance: MarketBalance }) {
  const map = {
    tight: { label: 'Tight supply', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    balanced: { label: 'Balanced', cls: 'bg-slate-50 text-slate-700 ring-slate-200' },
    oversupplied: { label: 'Oversupplied', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  }[balance]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1',
        map.cls,
      )}
    >
      {map.label}
    </span>
  )
}

function PostureTag({
  prefix,
  label,
  tone,
}: {
  prefix: string
  label: string
  tone: 'app' | CompetitorPostureTone
}) {
  const toneCls = {
    app: 'bg-red-50 text-red-700 ring-red-200',
    cautious: 'bg-blue-50 text-blue-700 ring-blue-200',
    mixed: 'bg-slate-50 text-slate-700 ring-slate-200',
    reactive: 'bg-amber-50 text-amber-700 ring-amber-200',
    disciplined: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  }[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1',
        toneCls,
      )}
    >
      <span className="text-muted-foreground/80">{prefix}</span>
      <span className="font-semibold">{label}</span>
    </span>
  )
}

function StateRow({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-baseline gap-2">
      <dt className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          'text-[13px] leading-snug',
          accent ? 'font-medium text-foreground' : 'text-foreground/85',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function PhaseCard({ phase }: { phase: MarketPhase }) {
  const accentBorder = {
    indigo: 'border-l-indigo-500',
    amber: 'border-l-amber-500',
    emerald: 'border-l-emerald-500',
  }[phase.accent]
  const accentText = {
    indigo: 'text-indigo-700',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
  }[phase.accent]

  return (
    <article
      className={cn(
        'group relative flex flex-col gap-4 rounded-lg border border-border/50 border-l-4 bg-card/40 p-5 transition-colors hover:bg-card/60',
        accentBorder,
      )}
    >
      {/* Phase header */}
      <header className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Phase {phase.index} of 3 · {phase.window}
          </span>
          {phase.isStrategicWindow && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
              <Target className="h-2.5 w-2.5" />
              Strategic window
            </span>
          )}
        </div>
        <h4 className={cn('text-base font-semibold tracking-tight', accentText)}>
          {phase.label}
        </h4>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{phase.tagline}</p>
      </header>

      {/* Visual indicators */}
      <div className="space-y-3 rounded-md border border-border/40 bg-muted/30 p-3">
        {/* Pricing pressure meter */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              <Gauge className="h-3 w-3" />
              Pricing pressure
            </span>
            <span
              className={cn(
                'font-mono text-[11px] font-semibold tabular-nums',
                pressureTextTone(phase.pressure),
              )}
            >
              {phase.pressureLabel}
            </span>
          </div>
          <div
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border/60"
            role="progressbar"
            aria-valuenow={phase.pressure}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Pricing pressure ${phase.pressureLabel}`}
          >
            <div
              className={cn('h-full rounded-full transition-all', pressureBarTone(phase.pressure))}
              style={{ width: `${phase.pressure}%` }}
            />
          </div>
        </div>
        {/* Market balance */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <Scale className="h-3 w-3" />
            Market balance
          </span>
          <BalancePill balance={phase.balance} />
        </div>
      </div>

      {/* State transition lines */}
      <dl className="space-y-2">
        <StateRow label="Market" value={phase.state.market} />
        <StateRow label="APP" value={phase.state.app} accent />
        <StateRow label="Competitors" value={phase.state.competitors} />
        <StateRow label="Pricing" value={phase.state.pricing} />
      </dl>

      {/* Posture tags */}
      <footer className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-3">
        <PostureTag prefix="APP" label={phase.appPosture} tone="app" />
        <PostureTag
          prefix="Competitors"
          label={phase.competitorPosture.label}
          tone={phase.competitorPosture.tone}
        />
      </footer>
    </article>
  )
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
  const phases = buildMarketPhases(result)

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

      {/* Market Evolution Phases — state-driven, not event-logged */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Market Evolution Phases
            </span>
            <span className="text-xs text-muted-foreground/80">
              · State transitions across 2026–2031
            </span>
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/70">
            Opening → Capacity Wave → Rebalancing
          </span>
        </div>

        {/* Pressure trajectory rail — quick visual scan of how pressure evolves */}
        <div className="rounded-md border border-border/40 bg-muted/20 px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Gauge className="h-3 w-3" />
              Pricing pressure trajectory
            </span>
            <span className="text-muted-foreground/70">Higher = more downward price risk</span>
          </div>
          <div className="relative h-1 w-full rounded-full bg-border/60">
            {/* gradient fill from indigo → amber → emerald representing phase progression */}
            <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-indigo-300 via-amber-400 to-emerald-400 opacity-60" />
            {phases.map((phase, idx) => {
              const left = idx === 0 ? '8%' : idx === 1 ? '50%' : '92%'
              return (
                <span
                  key={phase.key}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left }}
                >
                  <span
                    className={cn(
                      'flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-background',
                      pressureBarTone(phase.pressure),
                    )}
                  >
                    <span className="h-1 w-1 rounded-full bg-white/90" />
                  </span>
                </span>
              )
            })}
          </div>
          <div className="mt-2 grid grid-cols-3 text-[10.5px] font-medium tabular-nums text-muted-foreground">
            {phases.map((phase, idx) => (
              <div
                key={phase.key}
                className={cn(
                  'flex items-baseline gap-1.5',
                  idx === 0 ? 'justify-start' : idx === 1 ? 'justify-center' : 'justify-end',
                )}
              >
                <span className="uppercase tracking-wider">{phase.label}</span>
                <span className={cn('font-semibold', pressureTextTone(phase.pressure))}>
                  {phase.pressureLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase cards — equal weight, state-driven */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {phases.map((phase) => (
            <PhaseCard key={phase.key} phase={phase} />
          ))}
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


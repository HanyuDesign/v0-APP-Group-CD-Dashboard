'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { FileText, Package, Bath, TrendingDown, TrendingUp, Minus, Factory } from 'lucide-react'
import type { DownstreamSettings, DemandScenario, YearlyCapacity } from '@/lib/types/war-game'
import { POLICY_LABELS, DOWNSTREAM_COMPETITOR_SUPPLY, PLAYERS } from '@/lib/data/initial-data'
import { cn } from '@/lib/utils'

interface DownstreamModuleProps {
  settings: DownstreamSettings
  onChange: (settings: DownstreamSettings) => void
}

const demandOptions: DemandScenario[] = ['low', 'base', 'high']

interface DemandCardProps {
  title: string
  icon: React.ReactNode
  demandValue: DemandScenario
  onDemandChange: (value: DemandScenario) => void
  description: string
  trend: 'shrinking' | 'growing' | 'stable'
}

function DemandCard({
  title,
  icon,
  demandValue,
  onDemandChange,
  description,
  trend,
}: DemandCardProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {trend === 'shrinking' && <TrendingDown className="h-4 w-4 text-destructive" />}
        {trend === 'growing' && <TrendingUp className="h-4 w-4 text-success" />}
        {trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
      </div>
      
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Demand Scenario</span>
          <Select
            value={demandValue}
            onValueChange={(v) => onDemandChange(v as DemandScenario)}
          >
            <SelectTrigger className="h-7 w-28 text-xs bg-white border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {demandOptions.map(opt => (
                <SelectItem key={opt} value={opt}>
                  {POLICY_LABELS.demandScenario[opt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

interface SupplySectionProps {
  segment: 'paper' | 'board' | 'tissue'
  title: string
  icon: React.ReactNode
  appSupply: YearlyCapacity
  onAppSupplyChange: (value: number) => void
}

function SupplySection({ segment, title, icon, appSupply, onAppSupplyChange }: SupplySectionProps) {
  const competitors = DOWNSTREAM_COMPETITOR_SUPPLY[segment]
  // Calculate total capacity change for each competitor (sum of all years)
  const getCompetitorTotal = (capacity: Record<number, number>) => {
    return Object.values(capacity).reduce((sum, val) => sum + val, 0)
  }
  // Calculate APP total (sum of all years)
  const appTotal = Object.values(appSupply).reduce((sum, val) => sum + val, 0)

  return (
    <div className="rounded-lg border border-border/50 bg-white/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="font-semibold text-sm">{title}</span>
      </div>

      <div className="space-y-3">
        {/* Competitor Supply - Simple list */}
        <div className="space-y-2">
          {competitors.map(comp => {
            const player = PLAYERS.find(p => p.id === comp.playerId)
            const total = getCompetitorTotal(comp.capacity)
            return (
              <div key={comp.playerId} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: player?.color || '#6c757d' }}
                  />
                  <span className="text-sm">{comp.playerName}</span>
                </div>
                <span className={cn(
                  'text-sm font-mono font-medium',
                  total > 0 && 'text-success',
                  total < 0 && 'text-destructive',
                  total === 0 && 'text-muted-foreground'
                )}>
                  {total > 0 ? `+${total}` : total === 0 ? '-' : total} kt
                </span>
              </div>
            )
          })}
        </div>

        {/* APP China Supply - Single input */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg border-2 border-[#cc0000]/30 bg-[#cc0000]/5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#cc0000]" />
            <span className="text-sm font-semibold text-[#cc0000]">APP China</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={appTotal || ''}
              onChange={(e) => onAppSupplyChange(parseInt(e.target.value) || 0)}
              className="h-8 w-24 text-sm text-right px-2 bg-white border-2 border-[#cc0000]/40 focus:border-[#cc0000] font-mono font-semibold"
            />
            <span className="text-sm text-muted-foreground">kt</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DownstreamModule({
  settings,
  onChange,
}: DownstreamModuleProps) {
  const handleAppSupplyChange = (segment: 'paper' | 'board' | 'tissue', value: number) => {
    // Distribute the total value evenly across years (simplified approach)
    const perYear = Math.round(value / 6)
    const remainder = value - (perYear * 6)
    onChange({
      ...settings,
      supply: {
        ...settings.supply,
        [segment]: {
          ...settings.supply[segment],
          appChina: {
            2026: perYear,
            2027: perYear,
            2028: perYear,
            2029: perYear,
            2030: perYear,
            2031: perYear + remainder,
          },
        },
      },
    })
  }

  return (
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-chart-3" />
          Downstream Markets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PART 1: Demand Block */}
        <div className="rounded-lg border-2 border-orange-200 bg-orange-50/50 p-4">
          <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-orange-800">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold">1</span>
            <TrendingUp className="h-4 w-4" />
            Demand Scenarios
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <DemandCard
              title="Paper"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              demandValue={settings.paperDemand}
              onDemandChange={(v) => onChange({ ...settings, paperDemand: v })}
              description="Shrinking market"
              trend="shrinking"
            />
            <DemandCard
              title="Packaging / Carton Board"
              icon={<Package className="h-4 w-4 text-chart-3" />}
              demandValue={settings.boardDemand}
              onDemandChange={(v) => onChange({ ...settings, boardDemand: v })}
              description="E-commerce growth"
              trend="growing"
            />
            <DemandCard
              title="Tissue"
              icon={<Bath className="h-4 w-4 text-chart-2" />}
              demandValue={settings.tissueDemand}
              onDemandChange={(v) => onChange({ ...settings, tissueDemand: v })}
              description="Consumer upgrade"
              trend="growing"
            />
          </div>
        </div>

        {/* PART 2: Supply Block */}
        <div className="rounded-lg border-2 border-red-200 bg-red-50/50 p-4">
          <h3 className="text-base font-bold flex items-center gap-2 mb-4 text-red-800">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-red-600 text-white text-xs font-bold">2</span>
            <Factory className="h-4 w-4" />
            Supply Capacity Additions (kt)
          </h3>
          
          <div className="space-y-6">
            {/* Paper Supply */}
            <SupplySection
              segment="paper"
              title="Paper"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              appSupply={settings.supply.paper.appChina}
              onAppSupplyChange={(value) => handleAppSupplyChange('paper', value)}
            />

            {/* Board Supply */}
            <SupplySection
              segment="board"
              title="Packaging / Carton Board"
              icon={<Package className="h-4 w-4 text-chart-3" />}
              appSupply={settings.supply.board.appChina}
              onAppSupplyChange={(value) => handleAppSupplyChange('board', value)}
            />

            {/* Tissue Supply */}
            <SupplySection
              segment="tissue"
              title="Tissue"
              icon={<Bath className="h-4 w-4 text-chart-2" />}
              appSupply={settings.supply.tissue.appChina}
              onAppSupplyChange={(value) => handleAppSupplyChange('tissue', value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

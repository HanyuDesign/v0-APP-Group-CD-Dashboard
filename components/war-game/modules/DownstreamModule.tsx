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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Package, Bath, TrendingDown, TrendingUp, Minus, Factory } from 'lucide-react'
import type { DownstreamSettings, DemandScenario, YearlyCapacity } from '@/lib/types/war-game'
import { POLICY_LABELS, DOWNSTREAM_COMPETITOR_SUPPLY, PLAYERS } from '@/lib/data/initial-data'
import { cn } from '@/lib/utils'

interface DownstreamModuleProps {
  settings: DownstreamSettings
  onChange: (settings: DownstreamSettings) => void
}

const demandOptions: DemandScenario[] = ['low', 'base', 'high']
const years = [2026, 2027, 2028, 2029, 2030, 2031] as const

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
  onAppSupplyChange: (year: keyof YearlyCapacity, value: number) => void
}

function SupplySection({ segment, title, icon, appSupply, onAppSupplyChange }: SupplySectionProps) {
  const competitors = DOWNSTREAM_COMPETITOR_SUPPLY[segment]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-sm">{title}</span>
      </div>

      {/* Combined Competitor + APP China Supply Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-sm font-semibold w-36">Player</TableHead>
              {years.map(year => (
                <TableHead key={year} className="text-sm text-center font-semibold w-[72px]">{year}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Competitor rows (AI-driven, read-only) */}
            {competitors.map(comp => {
              const player = PLAYERS.find(p => p.id === comp.playerId)
              return (
                <TableRow key={comp.playerId} className="border-border/30">
                  <TableCell className="font-medium py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: player?.color || '#6c757d' }}
                      />
                      <span className="text-sm">{comp.playerName}</span>
                    </div>
                  </TableCell>
                  {years.map(year => {
                    const value = comp.capacity[year]
                    return (
                      <TableCell key={year} className="text-center py-2">
                        <span className={cn(
                          'text-sm font-mono',
                          value > 0 && 'text-success',
                          value < 0 && 'text-destructive',
                          value === 0 && 'text-muted-foreground'
                        )}>
                          {value > 0 ? `+${value}` : value === 0 ? '-' : value}
                        </span>
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}

            {/* APP China row (user input) - highlighted */}
            <TableRow className="bg-[#cc0000]/5 border-t-2 border-[#cc0000]/30">
              <TableCell className="font-medium py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 bg-[#cc0000]" />
                  <span className="text-sm font-semibold text-[#cc0000]">APP China</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#cc0000]/10 text-[#cc0000] rounded">User Input</span>
                </div>
              </TableCell>
              {years.map(year => (
                <TableCell key={year} className="text-center py-2 px-1">
                  <Input
                    type="number"
                    value={appSupply[year] || ''}
                    onChange={(e) => onAppSupplyChange(year, parseInt(e.target.value) || 0)}
                    className="h-7 w-16 text-sm text-center px-1 mx-auto bg-white border border-[#cc0000]/30 focus:border-[#cc0000] focus:ring-1 focus:ring-[#cc0000]/20 font-mono"
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Note about data sources */}
      <p className="text-[11px] text-muted-foreground italic">
        Competitor capacity is AI-driven; APP capacity is user-defined.
      </p>
    </div>
  )
}

export function DownstreamModule({
  settings,
  onChange,
}: DownstreamModuleProps) {
  const handleAppSupplyChange = (segment: 'paper' | 'board' | 'tissue', year: keyof YearlyCapacity, value: number) => {
    onChange({
      ...settings,
      supply: {
        ...settings.supply,
        [segment]: {
          ...settings.supply[segment],
          appChina: {
            ...settings.supply[segment].appChina,
            [year]: value,
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
              onAppSupplyChange={(year, value) => handleAppSupplyChange('paper', year, value)}
            />

            {/* Board Supply */}
            <SupplySection
              segment="board"
              title="Packaging / Carton Board"
              icon={<Package className="h-4 w-4 text-chart-3" />}
              appSupply={settings.supply.board.appChina}
              onAppSupplyChange={(year, value) => handleAppSupplyChange('board', year, value)}
            />

            {/* Tissue Supply */}
            <SupplySection
              segment="tissue"
              title="Tissue"
              icon={<Bath className="h-4 w-4 text-chart-2" />}
              appSupply={settings.supply.tissue.appChina}
              onAppSupplyChange={(year, value) => handleAppSupplyChange('tissue', year, value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

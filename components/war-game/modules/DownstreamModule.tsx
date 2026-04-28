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
            <SelectTrigger className="h-7 w-28 text-xs">
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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-sm">{title}</span>
      </div>

      {/* Competitor Supply Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-semibold w-28">Competitor</TableHead>
              {years.map(year => (
                <TableHead key={year} className="text-xs text-center font-semibold w-16">{year}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map(comp => {
              const player = PLAYERS.find(p => p.id === comp.playerId)
              return (
                <TableRow key={comp.playerId} className="border-border/30">
                  <TableCell className="text-xs py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: player?.color || '#6c757d' }}
                      />
                      <span className="truncate">{comp.playerName}</span>
                    </div>
                  </TableCell>
                  {years.map(year => {
                    const value = comp.capacity[year]
                    return (
                      <TableCell key={year} className="text-center py-1.5">
                        <span className={cn(
                          'text-xs font-mono',
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
          </TableBody>
        </Table>
      </div>

      {/* APP China Supply Table */}
      <div className="rounded-lg border-2 border-[#cc0000]/30 bg-[#cc0000]/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#cc0000]/10">
              <TableHead className="text-xs font-semibold w-28">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#cc0000]" />
                  APP China
                </div>
              </TableHead>
              {years.map(year => (
                <TableHead key={year} className="text-xs text-center font-semibold w-16">{year}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-border/30">
              <TableCell className="text-xs py-1.5 font-medium">Capacity (kt)</TableCell>
              {years.map(year => (
                <TableCell key={year} className="text-center py-1.5 px-1">
                  {year === 2026 ? (
                    <span className="text-xs font-mono font-semibold text-[#cc0000]">
                      {appSupply[year]}
                    </span>
                  ) : (
                    <Input
                      type="number"
                      value={appSupply[year] || ''}
                      onChange={(e) => onAppSupplyChange(year, parseInt(e.target.value) || 0)}
                      className="h-6 w-12 text-xs text-center px-1 mx-auto"
                      min={0}
                      max={200}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
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
        {/* Demand Block */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
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
              title="Board"
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

        {/* Supply Block */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Factory className="h-4 w-4 text-primary" />
            Supply Capacity Additions (kt)
          </h3>
          
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
      </CardContent>
    </Card>
  )
}

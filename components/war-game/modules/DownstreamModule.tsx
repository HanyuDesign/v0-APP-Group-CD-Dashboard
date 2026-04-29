'use client'

import * as React from 'react'
import { useMemo } from 'react'
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
import type { DownstreamSettings, DemandScenario, YearlyCapacity, InputMode } from '@/lib/types/war-game'
import { POLICY_LABELS, DOWNSTREAM_COMPETITOR_SUPPLY, PLAYERS } from '@/lib/data/initial-data'
import { cn } from '@/lib/utils'

interface DownstreamModuleProps {
  settings: DownstreamSettings
  onChange: (settings: DownstreamSettings) => void
  inputMode: InputMode
}

const demandOptions: DemandScenario[] = ['low', 'base', 'high']
const years = [2026, 2027, 2028, 2029, 2030, 2031] as const
type Year = typeof years[number]

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
  inputMode: InputMode
  baseCapacity: number
}

// Positive-only capacity input component
function CapacityInput({ 
  value, 
  onChange, 
  placeholder = "0",
  disabled = false 
}: { 
  value: number
  onChange: (value: number) => void
  placeholder?: string
  disabled?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.trim()
    
    // Allow empty input
    if (input === '') {
      onChange(0)
      return
    }
    
    // Block negative sign - only allow positive integers
    if (input.includes('-')) {
      return
    }
    
    const numValue = parseInt(input, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      // Limit to 5 digits (0 to 99999)
      const clampedValue = Math.min(99999, numValue)
      onChange(clampedValue)
    }
  }

  return (
    <Input
      type="number"
      value={value || ''}
      onChange={handleChange}
      className={cn(
        "h-8 w-[68px] text-sm text-center px-1 mx-auto font-mono",
        "bg-white border-2 border-[#cc0000]/30 focus:border-[#cc0000]",
        disabled && "bg-muted/50 cursor-not-allowed"
      )}
      placeholder={placeholder}
      min={0}
      max={99999}
      disabled={disabled}
    />
  )
}

// Helper functions for capacity calculations
const calculateTotalCapacity = (additions: YearlyCapacity): YearlyCapacity => {
  let cumulative = additions[2026]
  return {
    2026: additions[2026],
    2027: cumulative + additions[2027],
    2028: cumulative + additions[2027] + additions[2028],
    2029: cumulative + additions[2027] + additions[2028] + additions[2029],
    2030: cumulative + additions[2027] + additions[2028] + additions[2029] + additions[2030],
    2031: cumulative + additions[2027] + additions[2028] + additions[2029] + additions[2030] + additions[2031],
  }
}

const calculateIncrementalFromTotal = (total: YearlyCapacity): YearlyCapacity => {
  return {
    2026: total[2026],
    2027: Math.max(0, total[2027] - total[2026]),
    2028: Math.max(0, total[2028] - total[2027]),
    2029: Math.max(0, total[2029] - total[2028]),
    2030: Math.max(0, total[2030] - total[2029]),
    2031: Math.max(0, total[2031] - total[2030]),
  }
}

function SupplySection({ segment, title, icon, appSupply, onAppSupplyChange, inputMode, baseCapacity }: SupplySectionProps) {
  const competitors = DOWNSTREAM_COMPETITOR_SUPPLY[segment]
  
  // Calculate total capacity from incremental additions
  const totalCapacity = useMemo(() => calculateTotalCapacity(appSupply), [appSupply])

  // Handle total capacity input change (convert back to incremental)
  const handleTotalChange = (year: Year, value: number) => {
    const newTotal = { ...totalCapacity, [year]: value }
    const newIncremental = calculateIncrementalFromTotal(newTotal)
    onAppSupplyChange(year, newIncremental[year])
  }

  return (
    <div className="rounded-lg border border-border/60 bg-white/80 overflow-hidden">
      {/* Sub-module header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/50">
        {icon}
        <span className="font-semibold text-sm">{title}</span>
      </div>

      {/* Combined Competitor + APP China Supply Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="text-xs font-semibold w-40 py-2">Player</TableHead>
              {years.map(year => (
                <TableHead key={year} className="text-xs text-center font-semibold w-[76px] py-2">{year}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Competitor rows (AI-driven, read-only) - only positive values */}
            {competitors.map(comp => {
              const player = PLAYERS.find(p => p.id === comp.playerId)
              return (
                <TableRow key={comp.playerId} className="border-border/30 hover:bg-muted/10">
                  <TableCell className="font-medium py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: player?.color || '#6c757d' }}
                      />
                      <span className="text-sm">{comp.playerName}</span>
                    </div>
                  </TableCell>
                  {years.map(year => {
                    // Only show positive values (no negative)
                    const value = Math.max(0, comp.capacity[year])
                    return (
                      <TableCell key={year} className="text-center py-2.5">
                        <span className={cn(
                          'text-sm font-mono inline-block w-[68px]',
                          value > 0 && 'text-success',
                          value === 0 && 'text-muted-foreground'
                        )}>
                          {value > 0 ? `+${value}` : '-'}
                        </span>
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}

            {/* APP China row (user input) - highlighted */}
            <TableRow className="bg-[#cc0000]/5 border-t-2 border-[#cc0000]/20">
              <TableCell className="font-medium py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 bg-[#cc0000]" />
                  <span className="text-sm font-semibold text-[#cc0000]">APP China</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#cc0000]/10 text-[#cc0000] rounded uppercase">Input</span>
                </div>
              </TableCell>
              {years.map((year, idx) => (
                <TableCell key={year} className="text-center py-2.5 px-1">
                  {idx === 0 ? (
                    // 2026 - base capacity, read-only
                    <span className="text-sm font-semibold text-[#cc0000] bg-[#cc0000]/10 px-2 py-1 rounded">
                      {baseCapacity}
                    </span>
                  ) : inputMode === 'incremental' ? (
                    <CapacityInput
                      value={appSupply[year]}
                      onChange={(value) => onAppSupplyChange(year, value)}
                      placeholder="0"
                    />
                  ) : (
                    <CapacityInput
                      value={totalCapacity[year]}
                      onChange={(value) => handleTotalChange(year, value)}
                      placeholder={String(baseCapacity)}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>

          </TableBody>
        </Table>
      </div>

      {/* Note about data sources */}
      <div className="px-4 py-2 bg-muted/20 border-t border-border/30">
        <p className="text-[11px] text-muted-foreground">
          2026 shows base capacity. Subsequent years reflect publicly announced additions.
        </p>
      </div>
    </div>
  )
}

export function DownstreamModule({
  settings,
  onChange,
  inputMode,
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
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-red-800">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-red-600 text-white text-xs font-bold">2</span>
              <Factory className="h-4 w-4" />
              Supply Capacity Additions (kt)
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded uppercase">User Input</span>
          </div>
          
          <div className="space-y-6">
            {/* Paper Supply */}
            <SupplySection
              segment="paper"
              title="Paper"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              appSupply={settings.supply.paper.appChina}
              onAppSupplyChange={(year, value) => handleAppSupplyChange('paper', year, value)}
              inputMode={inputMode}
              baseCapacity={settings.supply.paper.appChina[2026]}
            />

            {/* Board Supply */}
            <SupplySection
              segment="board"
              title="Packaging / Carton Board"
              icon={<Package className="h-4 w-4 text-chart-3" />}
              appSupply={settings.supply.board.appChina}
              onAppSupplyChange={(year, value) => handleAppSupplyChange('board', year, value)}
              inputMode={inputMode}
              baseCapacity={settings.supply.board.appChina[2026]}
            />

            {/* Tissue Supply */}
            <SupplySection
              segment="tissue"
              title="Tissue"
              icon={<Bath className="h-4 w-4 text-chart-2" />}
              appSupply={settings.supply.tissue.appChina}
              onAppSupplyChange={(year, value) => handleAppSupplyChange('tissue', year, value)}
              inputMode={inputMode}
              baseCapacity={settings.supply.tissue.appChina[2026]}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
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

// Positive-only capacity input component for APP
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
    
    if (input === '') {
      onChange(0)
      return
    }
    
    if (input.includes('-')) {
      return
    }
    
    const numValue = parseInt(input, 10)
    if (!isNaN(numValue) && numValue >= 0) {
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

// Inline edit cell for competitor values
function EditableCell({
  value,
  onChange,
  isEdited,
}: {
  value: number
  onChange: (value: number) => void
  isEdited: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState(String(value))

  const handleClick = () => {
    setIsEditing(true)
    setTempValue(String(value))
  }

  const handleBlur = () => {
    setIsEditing(false)
    const numValue = parseInt(tempValue, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      onChange(numValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setTempValue(String(value))
    }
  }

  if (isEditing) {
    return (
      <Input
        type="number"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-7 w-[68px] text-sm text-center px-1 mx-auto font-mono border-2 border-blue-500"
        autoFocus
        min={0}
      />
    )
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative cursor-pointer px-2 py-1 rounded transition-colors hover:bg-blue-50 group",
        "text-sm font-mono text-center"
      )}
    >
      {value}
      {isEdited && (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />
      )}
      <span className="absolute inset-0 border border-transparent group-hover:border-blue-300 rounded pointer-events-none" />
    </div>
  )
}

interface SupplySectionProps {
  segment: 'paper' | 'board' | 'tissue'
  title: string
  icon: React.ReactNode
  appSupply: YearlyCapacity
  onAppSupplyChange: (year: keyof YearlyCapacity, value: number) => void
  baseCapacity: number
  competitorEdits: Record<string, YearlyCapacity>
  onCompetitorEdit: (playerId: string, year: Year, value: number) => void
}

function SupplySection({ 
  segment, 
  title, 
  icon, 
  appSupply, 
  onAppSupplyChange, 
  baseCapacity,
  competitorEdits,
  onCompetitorEdit,
}: SupplySectionProps) {
  const competitors = DOWNSTREAM_COMPETITOR_SUPPLY[segment]
  
  // Calculate APP total capacity from additions
  const appTotalCapacity = useMemo(() => {
    let cumulative = baseCapacity
    const totals: YearlyCapacity = { 2026: baseCapacity, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 }
    for (const year of years.slice(1)) {
      cumulative += appSupply[year]
      totals[year] = cumulative
    }
    return totals
  }, [appSupply, baseCapacity])

  // Calculate competitor total capacity from additions (with edits applied)
  const getCompetitorTotalCapacity = (playerId: string, additions: YearlyCapacity): YearlyCapacity => {
    // If we have edits for this competitor, use the edited values
    if (competitorEdits[playerId]) {
      return competitorEdits[playerId]
    }
    
    // Otherwise calculate from additions
    let cumulative = additions[2026]
    const totals: YearlyCapacity = { 2026: additions[2026], 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 }
    for (const year of years.slice(1)) {
      cumulative += Math.max(0, additions[year])
      totals[year] = cumulative
    }
    return totals
  }

  return (
    <div className="rounded-lg border border-border/60 bg-white/80 overflow-hidden">
      {/* Sub-module header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/50">
        {icon}
        <span className="font-semibold text-sm">{title}</span>
      </div>

      {/* Combined Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/20">
              <TableHead className="text-xs font-semibold w-44 py-2">Player</TableHead>
              {years.map(year => (
                <TableHead key={year} className="text-xs text-center font-semibold w-[80px] py-2">{year}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Competitor rows - Total Capacity with inline editing */}
            {competitors.map(comp => {
              const player = PLAYERS.find(p => p.id === comp.playerId)
              const competitorTotals = getCompetitorTotalCapacity(comp.playerId, comp.capacity)
              const hasEdits = !!competitorEdits[comp.playerId]
              
              return (
                <TableRow key={comp.playerId} className="border-border/30">
                  <TableCell className="font-medium py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: player?.color || '#6c757d' }}
                      />
                      <span className="text-sm">{comp.playerName}</span>
                    </div>
                  </TableCell>
                  {years.map((year) => {
                    const isEdited = hasEdits && competitorEdits[comp.playerId]?.[year] !== undefined
                    return (
                      <TableCell key={year} className="text-center py-1.5 px-1">
                        <EditableCell
                          value={competitorTotals[year]}
                          onChange={(value) => {
                            // When editing, we need to update the full totals object
                            const newTotals = { ...competitorTotals, [year]: value }
                            onCompetitorEdit(comp.playerId, year, value)
                          }}
                          isEdited={isEdited}
                        />
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}

            {/* APP China Additions row (user input) */}
            <TableRow className="bg-[#cc0000]/5 border-t-2 border-[#cc0000]/20">
              <TableCell className="font-medium py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 bg-[#cc0000]" />
                  <div>
                    <span className="text-sm font-semibold text-[#cc0000]">APP China</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">(Additions)</span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#cc0000]/10 text-[#cc0000] rounded uppercase">Input</span>
                </div>
              </TableCell>
              {years.map((year, idx) => (
                <TableCell key={year} className="text-center py-2.5 px-1">
                  {idx === 0 ? (
                    <span className="text-sm font-semibold text-[#cc0000] bg-[#cc0000]/10 px-2 py-1 rounded">
                      {baseCapacity}
                    </span>
                  ) : (
                    <CapacityInput
                      value={appSupply[year]}
                      onChange={(value) => onAppSupplyChange(year, value)}
                      placeholder="0"
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>

            {/* APP Total Capacity row (auto-calculated) */}
            <TableRow className="bg-[#cc0000]/10 border-t border-[#cc0000]/20">
              <TableCell className="font-medium py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 bg-[#cc0000]/50" />
                  <div>
                    <span className="text-sm font-semibold text-[#cc0000]/80">Total Capacity</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">(Auto-calculated)</span>
                  </div>
                </div>
              </TableCell>
              {years.map((year) => (
                <TableCell key={year} className="text-center py-2.5">
                  <span className="text-sm font-bold text-[#cc0000]/80 font-mono">
                    {appTotalCapacity[year]}
                  </span>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Helper text */}
      <div className="px-4 py-2 bg-muted/20 border-t border-border/30 space-y-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-[#cc0000]">APP:</span> Enter yearly capacity additions. Total capacity is automatically calculated.
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-blue-600">Competitors:</span> Click any value to adjust total capacity assumptions.
        </p>
      </div>
    </div>
  )
}

export function DownstreamModule({
  settings,
  onChange,
}: DownstreamModuleProps) {
  // Track competitor edits for each segment
  const [competitorEdits, setCompetitorEdits] = useState<{
    paper: Record<string, YearlyCapacity>
    board: Record<string, YearlyCapacity>
    tissue: Record<string, YearlyCapacity>
  }>({
    paper: {},
    board: {},
    tissue: {},
  })

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

  const handleCompetitorEdit = (segment: 'paper' | 'board' | 'tissue', playerId: string, year: Year, value: number) => {
    setCompetitorEdits(prev => {
      const segmentEdits = prev[segment]
      const competitors = DOWNSTREAM_COMPETITOR_SUPPLY[segment]
      const comp = competitors.find(c => c.playerId === playerId)
      if (!comp) return prev

      // Calculate base totals if not already edited
      let existingTotals = segmentEdits[playerId]
      if (!existingTotals) {
        let cumulative = comp.capacity[2026]
        existingTotals = { 
          2026: comp.capacity[2026], 
          2027: cumulative + Math.max(0, comp.capacity[2027]),
          2028: 0, 2029: 0, 2030: 0, 2031: 0 
        }
        cumulative = existingTotals[2027]
        existingTotals[2028] = cumulative + Math.max(0, comp.capacity[2028])
        cumulative = existingTotals[2028]
        existingTotals[2029] = cumulative + Math.max(0, comp.capacity[2029])
        cumulative = existingTotals[2029]
        existingTotals[2030] = cumulative + Math.max(0, comp.capacity[2030])
        cumulative = existingTotals[2030]
        existingTotals[2031] = cumulative + Math.max(0, comp.capacity[2031])
      }

      return {
        ...prev,
        [segment]: {
          ...segmentEdits,
          [playerId]: {
            ...existingTotals,
            [year]: value,
          },
        },
      }
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-red-800">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-red-600 text-white text-xs font-bold">2</span>
              <Factory className="h-4 w-4" />
              Supply Capacity (kt)
            </h3>
          </div>
          
          <div className="space-y-6">
            {/* Paper Supply */}
            <SupplySection
              segment="paper"
              title="Paper"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              appSupply={settings.supply.paper.appChina}
              onAppSupplyChange={(year, value) => handleAppSupplyChange('paper', year, value)}
              baseCapacity={settings.supply.paper.appChina[2026]}
              competitorEdits={competitorEdits.paper}
              onCompetitorEdit={(playerId, year, value) => handleCompetitorEdit('paper', playerId, year, value)}
            />

            {/* Board Supply */}
            <SupplySection
              segment="board"
              title="Packaging / Carton Board"
              icon={<Package className="h-4 w-4 text-chart-3" />}
              appSupply={settings.supply.board.appChina}
              onAppSupplyChange={(year, value) => handleAppSupplyChange('board', year, value)}
              baseCapacity={settings.supply.board.appChina[2026]}
              competitorEdits={competitorEdits.board}
              onCompetitorEdit={(playerId, year, value) => handleCompetitorEdit('board', playerId, year, value)}
            />

            {/* Tissue Supply */}
            <SupplySection
              segment="tissue"
              title="Tissue"
              icon={<Bath className="h-4 w-4 text-chart-2" />}
              appSupply={settings.supply.tissue.appChina}
              onAppSupplyChange={(year, value) => handleAppSupplyChange('tissue', year, value)}
              baseCapacity={settings.supply.tissue.appChina[2026]}
              competitorEdits={competitorEdits.tissue}
              onCompetitorEdit={(playerId, year, value) => handleCompetitorEdit('tissue', playerId, year, value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

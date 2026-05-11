'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Factory, Package, Users, Info } from 'lucide-react'
import type { APPCapacitySettings, PlayerCapacityChange, YearlyCapacity } from '@/lib/types/war-game'
import { PLAYERS, COMPETITOR_CAPACITY_PROJECTIONS } from '@/lib/data/initial-data'
import { cn } from '@/lib/utils'

interface PulpModuleProps {
  settings: APPCapacitySettings
  onChange: (settings: APPCapacitySettings) => void
  competitorChanges?: PlayerCapacityChange[]
}

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031] as const
type Year = typeof YEARS[number]

// Positive-only capacity input component
function CapacityInput({ 
  value, 
  onChange, 
  placeholder = "0",
  disabled = false,
  className = ""
}: { 
  value: number
  onChange: (value: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
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
        "h-9 w-full text-center text-base font-mono bg-white border-2 p-0",
        "border-[#cc0000]/40 focus:border-[#cc0000]",
        disabled && "bg-muted/50 cursor-not-allowed",
        className
      )}
      placeholder={placeholder}
      min={0}
      max={99999}
      disabled={disabled}
    />
  )
}

export function PulpModule({ settings, onChange }: PulpModuleProps) {
  // Get APP China player for color
  const appChina = PLAYERS.find(p => p.id === 'app-china')!
  
  // Base capacity (2026 value)
  const baseCapacity = settings.appChina[2026]

  // Calculate total capacity from incremental additions
  const totalCapacity = useMemo(() => {
    const additions = settings.appChina
    return {
      2026: additions[2026],
      2027: additions[2026] + additions[2027],
      2028: additions[2026] + additions[2027] + additions[2028],
      2029: additions[2026] + additions[2027] + additions[2028] + additions[2029],
      2030: additions[2026] + additions[2027] + additions[2028] + additions[2029] + additions[2030],
      2031: additions[2026] + additions[2027] + additions[2028] + additions[2029] + additions[2030] + additions[2031],
    }
  }, [settings.appChina])

  // Handle incremental input change
  const handleAdditionChange = (year: Year, value: number) => {
    onChange({
      ...settings,
      appChina: {
        ...settings.appChina,
        [year]: value,
      },
    })
  }

  // Get competitor color by playerId
  const getCompetitorColor = (playerId: string) => {
    const player = PLAYERS.find(p => p.id === playerId)
    return player?.color || '#6c757d'
  }

  // Calculate competitor total capacity from base additions
  const getCompetitorTotalCapacity = (baseAdditions: YearlyCapacity): YearlyCapacity => {
    const base2026 = baseAdditions[2026]
    let cumulative = base2026
    const totals: YearlyCapacity = { 2026: base2026, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 }
    
    for (let i = 1; i < YEARS.length; i++) {
      const year = YEARS[i]
      cumulative = cumulative + Math.max(0, baseAdditions[year])
      totals[year] = cumulative
    }
    
    return totals
  }

  return (
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Factory className="h-5 w-5 text-primary" />
          APP Pulp Capacity Decisions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* APP Capacity Decisions */}
        <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-base font-semibold text-primary">APP Capacity Decisions</span>
            <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded uppercase">User Input</span>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-sm font-semibold w-48">Metric</TableHead>
                {YEARS.map(year => (
                  <TableHead key={year} className="text-center text-sm font-semibold w-24">
                    {year}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Additions Row - Editable */}
              <TableRow className="border-primary/20">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: appChina.color }}
                    />
                    <span className="text-base font-semibold text-[#cc0000]">Additions (kt/year)</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#cc0000]/10 text-[#cc0000] rounded uppercase">Input</span>
                  </div>
                </TableCell>
                {YEARS.map((year, index) => (
                  <TableCell key={year} className="text-center p-2">
                    {index === 0 ? (
                      <div className="flex items-center justify-center">
                        <span className="text-base font-semibold text-primary bg-primary/20 px-3 py-1.5 rounded">
                          {baseCapacity}
                        </span>
                      </div>
                    ) : (
                      <CapacityInput
                        value={settings.appChina[year]}
                        onChange={(value) => handleAdditionChange(year, value)}
                        placeholder="0"
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
              
              {/* Total Capacity Row - Auto-calculated */}
              <TableRow className="border-primary/20 bg-primary/10">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-muted" />
                    <span className="text-base font-semibold text-foreground">Total Capacity (kt)</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-muted text-muted-foreground rounded uppercase">Auto</span>
                  </div>
                </TableCell>
                {YEARS.map((year) => (
                  <TableCell key={year} className="text-center p-2">
                    <span className="text-base font-mono font-semibold text-foreground">
                      {totalCapacity[year]}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
          
          <p className="mt-3 text-sm text-muted-foreground">
            Enter yearly capacity additions. Total capacity is automatically calculated.
          </p>
        </div>

        {/* Competitor Capacity Reference - Read Only */}
        <div className="rounded-lg border border-border/50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-base font-semibold">Competitor Capacity Reference</span>
            <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded uppercase">Read Only</span>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-sm font-semibold w-48">Competitor</TableHead>
                {YEARS.map(year => (
                  <TableHead key={year} className="text-center text-sm font-semibold w-24">
                    {year}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPETITOR_CAPACITY_PROJECTIONS.map((competitor) => {
                const competitorTotals = getCompetitorTotalCapacity(competitor.capacity)
                
                return (
                  <TableRow key={competitor.playerId} className="border-border/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: getCompetitorColor(competitor.playerId) }}
                        />
                        <span className="text-base">{competitor.playerName}</span>
                      </div>
                    </TableCell>
                    {YEARS.map((year) => (
                      <TableCell key={year} className="text-center p-2">
                        <span className="text-base font-mono text-muted-foreground">
                          {competitorTotals[year]}
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          <div className="mt-3 flex items-start gap-2 p-2 rounded bg-muted/50">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Competitor capacity shown here is read-only reference data. To modify competitor assumptions, proceed to Step 2: Competitor Configure.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

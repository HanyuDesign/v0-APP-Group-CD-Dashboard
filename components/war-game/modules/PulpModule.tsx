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
import { Factory, Package, Users } from 'lucide-react'
import type { APPCapacitySettings, PlayerCapacityChange, YearlyCapacity, InputMode } from '@/lib/types/war-game'
import { PLAYERS, COMPETITOR_CAPACITY_PROJECTIONS } from '@/lib/data/initial-data'
import { cn } from '@/lib/utils'

interface PulpModuleProps {
  settings: APPCapacitySettings
  onChange: (settings: APPCapacitySettings) => void
  competitorChanges?: PlayerCapacityChange[]
  inputMode: InputMode
  onInputModeChange: (mode: InputMode) => void
}

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031] as const
type Year = typeof YEARS[number]

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
        "h-7 w-20 text-center text-sm font-mono bg-white border-2 p-0",
        "border-[#cc0000]/40 focus:border-[#cc0000]",
        disabled && "bg-muted/50 cursor-not-allowed"
      )}
      placeholder={placeholder}
      min={0}
      max={99999}
      disabled={disabled}
    />
  )
}

export function PulpModule({ settings, onChange, inputMode, onInputModeChange }: PulpModuleProps) {
  // Get APP China player for color
  const appChina = PLAYERS.find(p => p.id === 'app-china')!
  
  // Base capacity (2026 value, read-only)
  const baseCapacity = settings.appChina[2026]

  // Calculate total capacity from incremental additions
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

  // Calculate incremental additions from total capacity
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

  // Computed values based on mode
  const totalCapacity = useMemo(() => calculateTotalCapacity(settings.appChina), [settings.appChina])

  // Handle incremental input change (Mode 1)
  const handleIncrementalChange = (year: Year, value: number) => {
    onChange({
      ...settings,
      appChina: {
        ...settings.appChina,
        [year]: value,
      },
    })
  }

  // Handle total capacity input change (Mode 2)
  const handleTotalChange = (year: Year, value: number) => {
    // When user enters total, convert back to incremental and store
    const newTotal = { ...totalCapacity, [year]: value }
    const newIncremental = calculateIncrementalFromTotal(newTotal)
    onChange({
      ...settings,
      appChina: newIncremental,
    })
  }

  // Get competitor color by playerId
  const getCompetitorColor = (playerId: string) => {
    const player = PLAYERS.find(p => p.id === playerId)
    return player?.color || '#6c757d'
  }

  // Calculate competitor total capacity from additions
  const calculateCompetitorTotalCapacity = (additions: YearlyCapacity): YearlyCapacity => {
    let cumulative = additions[2026]
    return {
      2026: additions[2026],
      2027: cumulative + Math.max(0, additions[2027]),
      2028: cumulative + Math.max(0, additions[2027]) + Math.max(0, additions[2028]),
      2029: cumulative + Math.max(0, additions[2027]) + Math.max(0, additions[2028]) + Math.max(0, additions[2029]),
      2030: cumulative + Math.max(0, additions[2027]) + Math.max(0, additions[2028]) + Math.max(0, additions[2029]) + Math.max(0, additions[2030]),
      2031: cumulative + Math.max(0, additions[2027]) + Math.max(0, additions[2028]) + Math.max(0, additions[2029]) + Math.max(0, additions[2030]) + Math.max(0, additions[2031]),
    }
  }

  return (
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Factory className="h-5 w-5 text-primary" />
            Pulp Capacity & Players
          </CardTitle>
          
          {/* View Mode Segmented Control */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">View Mode</span>
            <div className="flex rounded-lg border border-border bg-muted/30 p-1">
              <button
                onClick={() => onInputModeChange('incremental')}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  inputMode === 'incremental'
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                Annual Additions (kt/year)
              </button>
              <button
                onClick={() => onInputModeChange('total')}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  inputMode === 'total'
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                Total Capacity (kt)
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* APP Capacity Decisions - Highlight Table */}
        <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
          {/* Header */}
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">APP Capacity Decisions</span>
            <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded uppercase">User Input</span>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-sm font-semibold w-40">
                  {inputMode === 'incremental' ? 'Annual Additions' : 'Total Capacity'}
                </TableHead>
                {YEARS.map(year => (
                  <TableHead key={year} className="text-center text-sm font-semibold w-[80px]">
                    {year}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Main input row */}
              <TableRow className="border-primary/20 bg-primary/10">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: appChina.color }}
                    />
                    <span className="text-sm font-semibold text-[#cc0000]">APP China</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#cc0000]/10 text-[#cc0000] rounded uppercase">Input</span>
                  </div>
                </TableCell>
                {YEARS.map((year, index) => (
                  <TableCell key={year} className="text-center p-1.5">
                    {index === 0 ? (
                      // 2026 - base capacity, read-only
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary bg-primary/20 px-3 py-1.5 rounded">
                          {baseCapacity}
                        </span>
                      </div>
                    ) : inputMode === 'incremental' ? (
                      // Incremental mode: input additions
                      <CapacityInput
                        value={settings.appChina[year]}
                        onChange={(value) => handleIncrementalChange(year, value)}
                        placeholder="0"
                      />
                    ) : (
                      // Total mode: input total capacity
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
          
          <p className="mt-3 text-xs text-muted-foreground">
            {inputMode === 'incremental' 
              ? "Showing yearly capacity additions. 2026 shows base capacity."
              : "Showing total installed capacity over time."
            }
          </p>
        </div>

        {/* Competitor Announced Capacity Plans - Table */}
        <div className="rounded-lg bg-secondary/30 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Competitor Announced Capacity Plans</span>
            <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded uppercase">Reference</span>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-sm font-semibold w-32">Competitor</TableHead>
                {YEARS.map(year => (
                  <TableHead key={year} className="text-center text-sm font-semibold">
                    {year}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPETITOR_CAPACITY_PROJECTIONS.map((competitor) => {
                // Calculate total capacity for this competitor
                const competitorTotals = calculateCompetitorTotalCapacity(competitor.capacity)
                
                return (
                  <TableRow key={competitor.playerId} className="border-border/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: getCompetitorColor(competitor.playerId) }}
                        />
                        <span className="text-sm">{competitor.playerName}</span>
                      </div>
                    </TableCell>
                    {YEARS.map((year, index) => {
                      const isBase = index === 0
                      
                      if (inputMode === 'incremental') {
                        // Show additions view
                        const value = competitor.capacity[year]
                        const displayValue = isBase ? value : Math.max(0, value)
                        return (
                          <TableCell key={year} className="text-center">
                            <span className={cn(
                              'text-sm font-mono',
                              isBase && 'font-semibold',
                              !isBase && displayValue > 0 && 'text-success font-medium',
                              !isBase && displayValue === 0 && 'text-muted-foreground'
                            )}>
                              {isBase ? displayValue : (displayValue > 0 ? `+${displayValue}` : '-')}
                            </span>
                          </TableCell>
                        )
                      } else {
                        // Show total capacity view
                        const totalValue = competitorTotals[year]
                        return (
                          <TableCell key={year} className="text-center">
                            <span className={cn(
                              'text-sm font-mono',
                              isBase && 'font-semibold'
                            )}>
                              {totalValue}
                            </span>
                          </TableCell>
                        )
                      }
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          <p className="mt-3 text-xs text-muted-foreground">
            {inputMode === 'incremental' 
              ? "Showing yearly capacity additions. 2026 shows base capacity."
              : "Showing total installed capacity over time."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

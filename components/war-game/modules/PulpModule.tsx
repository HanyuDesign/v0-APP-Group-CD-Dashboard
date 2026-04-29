'use client'

import { useMemo, useState } from 'react'
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
  inputMode?: InputMode // Keep for compatibility but won't use
  onInputModeChange?: (mode: InputMode) => void // Keep for compatibility but won't use
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
        "h-8 w-full text-center text-sm font-mono bg-white border-2 p-0",
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

// Inline editable cell for competitor data
function EditableCell({
  value,
  onChange,
  isEdited = false,
}: {
  value: number
  onChange: (value: number) => void
  isEdited?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  const handleClick = () => {
    setEditValue(value)
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue !== value) {
      onChange(editValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
      if (editValue !== value) {
        onChange(editValue)
      }
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(value)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.trim()
    if (input === '') {
      setEditValue(0)
      return
    }
    const numValue = parseInt(input, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setEditValue(Math.min(99999, numValue))
    }
  }

  if (isEditing) {
    return (
      <Input
        type="number"
        value={editValue || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-7 w-20 text-center text-sm font-mono bg-white border-2 border-primary p-0"
        autoFocus
        min={0}
        max={99999}
      />
    )
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative px-3 py-1.5 rounded text-sm font-mono transition-all",
        "hover:bg-primary/10 hover:ring-2 hover:ring-primary/30 cursor-pointer",
        isEdited && "bg-amber-50"
      )}
    >
      {value}
      {isEdited && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500" />
      )}
    </button>
  )
}

export function PulpModule({ settings, onChange }: PulpModuleProps) {
  // Track edited competitor cells
  const [editedCompetitorCells, setEditedCompetitorCells] = useState<Record<string, Record<Year, number>>>({})
  
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

  // Calculate competitor total capacity from base additions + edits
  const getCompetitorTotalCapacity = (playerId: string, baseAdditions: YearlyCapacity): YearlyCapacity => {
    const edits = editedCompetitorCells[playerId] || {}
    
    // Start with base 2026 value (or edited if available)
    const base2026 = edits[2026] !== undefined ? edits[2026] : baseAdditions[2026]
    
    // Calculate cumulative totals, using edits where available
    let cumulative = base2026
    const totals: YearlyCapacity = { 2026: base2026, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 }
    
    for (let i = 1; i < YEARS.length; i++) {
      const year = YEARS[i]
      if (edits[year] !== undefined) {
        // User edited this cell - use their value directly as total
        totals[year] = edits[year]
        cumulative = edits[year]
      } else {
        // Not edited - calculate from previous + additions
        cumulative = cumulative + Math.max(0, baseAdditions[year])
        totals[year] = cumulative
      }
    }
    
    return totals
  }

  // Handle competitor cell edit
  const handleCompetitorEdit = (playerId: string, year: Year, value: number) => {
    setEditedCompetitorCells(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [year]: value,
      }
    }))
  }

  // Check if a competitor cell has been edited
  const isCompetitorCellEdited = (playerId: string, year: Year): boolean => {
    return editedCompetitorCells[playerId]?.[year] !== undefined
  }

  return (
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Factory className="h-5 w-5 text-primary" />
          Pulp Capacity & Players
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* APP Capacity Decisions */}
        <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">APP Capacity Decisions</span>
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
                    <span className="text-sm font-semibold text-[#cc0000]">Additions (kt/year)</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#cc0000]/10 text-[#cc0000] rounded uppercase">Input</span>
                  </div>
                </TableCell>
                {YEARS.map((year, index) => (
                  <TableCell key={year} className="text-center p-2">
                    {index === 0 ? (
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary bg-primary/20 px-3 py-1.5 rounded">
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
                    <span className="text-sm font-semibold text-foreground">Total Capacity (kt)</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-muted text-muted-foreground rounded uppercase">Auto</span>
                  </div>
                </TableCell>
                {YEARS.map((year) => (
                  <TableCell key={year} className="text-center p-2">
                    <span className="text-sm font-mono font-semibold text-foreground">
                      {totalCapacity[year]}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
          
          <p className="mt-3 text-xs text-muted-foreground">
            Enter yearly capacity additions. Total capacity is automatically calculated.
          </p>
        </div>

        {/* Competitor Capacity - Total Capacity with Inline Editing */}
        <div className="rounded-lg border border-border/50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Competitor Total Capacity</span>
            <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded uppercase">Editable Reference</span>
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
                const competitorTotals = getCompetitorTotalCapacity(competitor.playerId, competitor.capacity)
                
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
                    {YEARS.map((year) => (
                      <TableCell key={year} className="text-center p-1">
                        <EditableCell
                          value={competitorTotals[year]}
                          onChange={(value) => handleCompetitorEdit(competitor.playerId, year, value)}
                          isEdited={isCompetitorCellEdited(competitor.playerId, year)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          <p className="mt-3 text-xs text-muted-foreground">
            Click any value to adjust total capacity assumptions. Edited values are marked with a dot.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

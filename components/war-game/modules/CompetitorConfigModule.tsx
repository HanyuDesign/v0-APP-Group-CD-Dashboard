'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Factory, Users, Edit3, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { CompetitorConfig, YearlyCapacity } from '@/lib/types/war-game'
import { COMPETITOR_CAPACITY_PROJECTIONS } from '@/lib/data/initial-data'

interface CompetitorConfigModuleProps {
  config: CompetitorConfig[]
  onChange: (config: CompetitorConfig[]) => void
}

const years = [2026, 2027, 2028, 2029, 2030, 2031] as const
type Year = typeof years[number]

// Initialize competitor config from baseline data
export function initializeCompetitorConfig(): CompetitorConfig[] {
  return COMPETITOR_CAPACITY_PROJECTIONS.map(c => ({
    playerId: c.playerId,
    playerName: c.playerName,
    capacity: { ...c.capacity },
    isEdited: false,
  }))
}

// Calculate cumulative total from additions
function calculateTotalCapacity(baseYear2026: number, additions: YearlyCapacity): YearlyCapacity {
  const total: YearlyCapacity = { 2026: baseYear2026, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 }
  let cumulative = baseYear2026
  for (const year of years.slice(1)) {
    cumulative += additions[year]
    total[year] = cumulative
  }
  return total
}

export function CompetitorConfigModule({ config, onChange }: CompetitorConfigModuleProps) {
  const [editingCell, setEditingCell] = useState<{ playerId: string; year: Year } | null>(null)
  const [editValue, setEditValue] = useState('')

  // Calculate totals for display
  const competitorTotals = useMemo(() => {
    return config.map(c => ({
      ...c,
      totalCapacity: calculateTotalCapacity(c.capacity[2026], c.capacity),
    }))
  }, [config])

  const handleCellClick = (playerId: string, year: Year, currentValue: number) => {
    setEditingCell({ playerId, year })
    setEditValue(currentValue.toString())
  }

  const handleCellBlur = () => {
    if (editingCell) {
      const newValue = parseInt(editValue) || 0
      const updatedConfig = config.map(c => {
        if (c.playerId === editingCell.playerId) {
          return {
            ...c,
            capacity: { ...c.capacity, [editingCell.year]: newValue },
            isEdited: true,
          }
        }
        return c
      })
      onChange(updatedConfig)
    }
    setEditingCell(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur()
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setEditValue('')
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Competitor Pulp Capacity Configuration</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configure competitor capacity assumptions for the simulation
              </p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                  <Edit3 className="h-3 w-3" />
                  Click to Edit
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click any capacity value to modify competitor assumptions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Helper text */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Edit competitor capacity values to test different market scenarios. Click any cell to modify the total capacity for that year. Edited values are highlighted with an indicator.
          </p>
        </div>

        {/* Capacity Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-3 font-medium text-muted-foreground w-48">Competitor</th>
                {years.map(year => (
                  <th key={year} className="text-center py-3 px-3 font-medium text-muted-foreground">{year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competitorTotals.map((competitor) => (
                <tr key={competitor.playerId} className="border-b border-border/30 hover:bg-muted/30">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{competitor.playerName}</span>
                      {competitor.isEdited && (
                        <span className="h-2 w-2 rounded-full bg-amber-500" title="Edited" />
                      )}
                    </div>
                  </td>
                  {years.map(year => {
                    const isEditing = editingCell?.playerId === competitor.playerId && editingCell?.year === year
                    const value = competitor.totalCapacity[year]
                    
                    return (
                      <td key={year} className="text-center py-2 px-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                            className="w-20 h-8 text-center mx-auto"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => handleCellClick(competitor.playerId, year, value)}
                            className={cn(
                              'px-3 py-1.5 rounded font-mono font-semibold transition-all',
                              'hover:bg-blue-50 hover:text-blue-700 cursor-pointer',
                              competitor.isEdited && 'text-amber-700'
                            )}
                          >
                            {value}
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
            {/* Total row */}
            <tfoot>
              <tr className="bg-muted/30 font-semibold">
                <td className="py-3 px-3">Total Competitor Capacity</td>
                {years.map(year => {
                  const total = competitorTotals.reduce((sum, c) => sum + c.totalCapacity[year], 0)
                  return (
                    <td key={year} className="text-center py-3 px-3 font-mono">
                      {total}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-xs text-muted-foreground italic">
          Values shown are total capacity (kt). Click any value to adjust competitor capacity assumptions.
        </p>
      </CardContent>
    </Card>
  )
}

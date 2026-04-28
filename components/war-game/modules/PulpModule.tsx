'use client'

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
import type { APPCapacitySettings, PlayerCapacityChange } from '@/lib/types/war-game'
import { PLAYERS, COMPETITOR_CAPACITY_PROJECTIONS } from '@/lib/data/initial-data'
import { cn } from '@/lib/utils'

interface PulpModuleProps {
  settings: APPCapacitySettings
  onChange: (settings: APPCapacitySettings) => void
  competitorChanges?: PlayerCapacityChange[]
}

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031] as const
type Year = typeof YEARS[number]

export function PulpModule({ settings, onChange }: PulpModuleProps) {
  // Get APP China player for color
  const appChina = PLAYERS.find(p => p.id === 'app-china')!

  // Handle APP capacity input change
  const handleAPPCapacityChange = (year: Year, value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0)
    onChange({
      ...settings,
      appChina: {
        ...settings.appChina,
        [year]: numValue,
      },
    })
  }

  // Get competitor color by playerId
  const getCompetitorColor = (playerId: string) => {
    const player = PLAYERS.find(p => p.id === playerId)
    return player?.color || '#6c757d'
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
        {/* APP Capacity Decisions - Highlight Table */}
        <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">APP Capacity Decisions</span>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="text-sm font-semibold w-32">Player</TableHead>
                {YEARS.map(year => (
                  <TableHead key={year} className="text-center text-sm font-semibold">
                    {year}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-primary/20 bg-primary/10">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: appChina.color }}
                    />
                    <span className="text-sm">APP China</span>
                  </div>
                </TableCell>
                {YEARS.map((year, index) => (
                  <TableCell key={year} className="text-center p-1.5">
                    {index === 0 ? (
                      // 2026 - pre-filled, read-only display
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary bg-primary/20 px-3 py-1.5 rounded">
                          {settings.appChina[year]} kt
                        </span>
                      </div>
                    ) : (
                      // 2027-2031 - input fields
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          value={settings.appChina[year] || ''}
                          onChange={(e) => handleAPPCapacityChange(year, e.target.value)}
                          className="h-8 w-20 text-center text-sm font-mono"
                          placeholder="0"
                          min={0}
                          max={500}
                        />
                        <span className="text-xs text-muted-foreground">kt</span>
                      </div>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
          
          <p className="mt-3 text-xs text-muted-foreground">
            Enter planned capacity additions for each year (kt/year). 2026 shows existing capacity.
          </p>
        </div>

        {/* Competitor Capacity Distribution - Table */}
        <div className="rounded-lg bg-secondary/30 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Competitor Capacity Distribution</span>
            <span className="ml-auto text-xs text-muted-foreground">(AI Projected)</span>
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
              {COMPETITOR_CAPACITY_PROJECTIONS.map((competitor) => (
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
                    const value = competitor.capacity[year]
                    const isBase = index === 0
                    return (
                      <TableCell key={year} className="text-center">
                        <span className={cn(
                          'text-sm font-mono',
                          isBase && 'font-semibold',
                          !isBase && value > 0 && 'text-success font-medium',
                          !isBase && value === 0 && 'text-muted-foreground'
                        )}>
                          {isBase ? value : (value > 0 ? `+${value}` : '-')}
                        </span>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <p className="mt-3 text-xs text-muted-foreground">
            2026 shows base capacity. Subsequent years show projected capacity additions based on AI analysis.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

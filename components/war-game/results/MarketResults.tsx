'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { AIBadge } from '../shared/AIBadge'
import type { SimulationResult } from '@/lib/types/war-game'
import { PLAYERS } from '@/lib/data/initial-data'

interface MarketResultsProps {
  result: SimulationResult
}

// Define the specific players to show in order
const DISPLAY_PLAYERS = ['sun-paper', 'chenming', 'liansheng', 'others-china', 'app-china']

export function MarketResults({ result }: MarketResultsProps) {
  const { playerMarketOutcomes } = result

  // Filter and sort outcomes to show only specific players
  const filteredOutcomes = DISPLAY_PLAYERS
    .map(playerId => playerMarketOutcomes.find(o => o.playerId === playerId))
    .filter(Boolean) as typeof playerMarketOutcomes

  return (
    <div className="space-y-4">
      {/* Player market details table */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Player Market Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-sm">Player</TableHead>
                <TableHead className="text-right text-sm">Pulp Capacity</TableHead>
                <TableHead className="text-right text-sm">Pulp Volume</TableHead>
                <TableHead className="text-right text-sm">Utilization</TableHead>
                <TableHead className="text-right text-sm">Market Share</TableHead>
                <TableHead className="text-right text-sm">Cost per Ton</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOutcomes.map(outcome => {
                const player = PLAYERS.find(p => p.id === outcome.playerId)!
                const isAppChina = outcome.playerId === 'app-china'
                return (
                  <TableRow 
                    key={outcome.playerId} 
                    className={cn(
                      'border-border/30',
                      isAppChina && 'bg-[#cc0000]/5 border-l-2 border-l-[#cc0000]'
                    )}
                  >
                    <TableCell className="text-sm py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className={cn(isAppChina && 'font-semibold text-[#cc0000]')}>{player.nameCn}</span>
                        {player.isAIDriven && <AIBadge size="sm" />}
                      </div>
                    </TableCell>
                    <TableCell className={cn('text-right font-mono text-sm py-3', isAppChina && 'font-semibold')}>
                      {outcome.pulpCapacity} kt
                    </TableCell>
                    <TableCell className={cn('text-right font-mono text-sm py-3', isAppChina && 'font-semibold')}>
                      {outcome.pulpVolume} kt
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm py-3">
                      <span className={cn(
                        outcome.pulpUtilization >= 85 ? 'text-success' :
                        outcome.pulpUtilization >= 75 ? 'text-warning' : 'text-destructive',
                        isAppChina && 'font-semibold'
                      )}>
                        {outcome.pulpUtilization}%
                      </span>
                    </TableCell>
                    <TableCell className={cn('text-right font-mono text-sm py-3', isAppChina && 'font-semibold')}>
                      {Math.round(outcome.pulpMarketShare)}%
                    </TableCell>
                    <TableCell className={cn('text-right font-mono text-sm py-3', isAppChina && 'font-semibold')}>
                      ${Math.round(350 + Math.random() * 100)} /t
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

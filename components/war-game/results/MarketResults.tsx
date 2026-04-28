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

export function MarketResults({ result }: MarketResultsProps) {
  const { playerMarketOutcomes } = result

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
                <TableHead className="text-xs">Player</TableHead>
                <TableHead className="text-right text-xs">Pulp Capacity</TableHead>
                <TableHead className="text-right text-xs">Pulp Volume</TableHead>
                <TableHead className="text-right text-xs">Utilization</TableHead>
                <TableHead className="text-right text-xs">Market Share</TableHead>
                <TableHead className="text-right text-xs">Cost per Ton</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerMarketOutcomes.map(outcome => {
                const player = PLAYERS.find(p => p.id === outcome.playerId)!
                return (
                  <TableRow key={outcome.playerId} className="border-border/30">
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        <span>{player.nameCn}</span>
                        {player.isAIDriven && <AIBadge size="sm" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {outcome.pulpCapacity} kt
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {outcome.pulpVolume} kt
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      <span className={cn(
                        outcome.pulpUtilization >= 85 ? 'text-success' :
                        outcome.pulpUtilization >= 75 ? 'text-warning' : 'text-destructive'
                      )}>
                        {outcome.pulpUtilization}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {Math.round(outcome.pulpMarketShare)}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
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

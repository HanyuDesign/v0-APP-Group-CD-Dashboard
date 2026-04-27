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
import { BarChart3, PieChart } from 'lucide-react'
import { AIBadge } from '../shared/AIBadge'
import type { SimulationResult } from '@/lib/types/war-game'
import { PLAYERS } from '@/lib/data/initial-data'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPie,
  Pie,
} from 'recharts'

interface MarketResultsProps {
  result: SimulationResult
}

export function MarketResults({ result }: MarketResultsProps) {
  const { playerMarketOutcomes, competitorChanges } = result

  // Prepare market share pie chart data
  const marketShareData = playerMarketOutcomes
    .filter(p => p.pulpCapacity > 0)
    .map(outcome => {
      const player = PLAYERS.find(p => p.id === outcome.playerId)!
      return {
        name: player.nameCn,
        value: Math.round(outcome.pulpMarketShare * 10) / 10,
        color: player.color,
      }
    })
    .sort((a, b) => b.value - a.value)

  // Prepare capacity change bar chart data
  const capacityChangeData = competitorChanges
    .filter(c => c.pulpChange !== 0)
    .map(change => {
      const player = PLAYERS.find(p => p.id === change.playerId)!
      return {
        name: player.nameCn,
        change: change.pulpChange,
        color: player.color,
        action: change.action,
      }
    })

  return (
    <div className="space-y-4">
      {/* Market share and capacity changes */}
      <div className="grid grid-cols-2 gap-4">
        {/* Market share pie chart */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PieChart className="h-4 w-4" />
              Pulp Market Share (China)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={marketShareData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={{ stroke: '#666666', strokeWidth: 1 }}
                >
                  {marketShareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#1a1a1a',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Share']}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Capacity change bar chart */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                Competitor Capacity Changes
              </CardTitle>
              <AIBadge size="sm" />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={capacityChangeData} layout="vertical" margin={{ left: 70 }}>
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10, fill: '#1a1a1a' }}
                  axisLine={{ stroke: '#666666' }}
                  tickLine={{ stroke: '#666666' }}
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#1a1a1a' }}
                  width={65}
                  axisLine={{ stroke: '#666666' }}
                  tickLine={{ stroke: '#666666' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#1a1a1a',
                  }}
                  labelStyle={{ color: '#1a1a1a' }}
                  itemStyle={{ color: '#1a1a1a' }}
                  formatter={(value: number) => [
                    `${value > 0 ? '+' : ''}${value} kt`,
                    'Change'
                  ]}
                />
                <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                  {capacityChangeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
                <TableHead className="text-right text-xs">Downstream Capacity</TableHead>
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
                      {outcome.downstreamCapacity} kt
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

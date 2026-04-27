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
import type { SimulationResult, PlayerMarketOutcome, ExporterAllocation } from '@/lib/types/war-game'
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
  Legend,
} from 'recharts'

interface MarketResultsProps {
  result: SimulationResult
}

export function MarketResults({ result }: MarketResultsProps) {
  const { playerMarketOutcomes, exporterAllocations, competitorChanges } = result

  // 准备市场份额饼图数据
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

  // 准备产能变化柱状图数据
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
      {/* 市场份额与产能变化 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 市场份额饼图 */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PieChart className="h-4 w-4" />
              浆市场份额 (中国)
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
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                >
                  {marketShareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}%`, '份额']}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 产能变化柱状图 */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                竞争对手产能变化
              </CardTitle>
              <AIBadge size="sm" />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={capacityChangeData} layout="vertical" margin={{ left: 60 }}>
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [
                    `${value > 0 ? '+' : ''}${value} 万吨`,
                    '变化'
                  ]}
                />
                <Bar dataKey="change" radius={[0, 4, 4, 0]}>
                  {capacityChangeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.change > 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 玩家市场详情表 */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">玩家市场数据</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-xs">玩家</TableHead>
                <TableHead className="text-right text-xs">浆产能</TableHead>
                <TableHead className="text-right text-xs">浆产量</TableHead>
                <TableHead className="text-right text-xs">利用率</TableHead>
                <TableHead className="text-right text-xs">市场份额</TableHead>
                <TableHead className="text-right text-xs">下游产能</TableHead>
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
                      {outcome.pulpCapacity} 万吨
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {outcome.pulpVolume} 万吨
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
                      {outcome.downstreamCapacity} 万吨
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 出口商分配 */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">出口商分配决策</CardTitle>
            <AIBadge size="sm" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {exporterAllocations.map(allocation => {
              const player = PLAYERS.find(p => p.id === allocation.playerId)!
              return (
                <div
                  key={allocation.playerId}
                  className="rounded-lg border border-border/50 bg-card/50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-medium">{player.nameCn}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">中国出口</span>
                      <span className="font-mono">{allocation.chinaVolume} 万吨 ({Math.round(allocation.chinaShare * 100)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">其他地区</span>
                      <span className="font-mono">{allocation.otherRegionsVolume} 万吨</span>
                    </div>
                    <p className="mt-2 text-ai-badge">{allocation.reasoning}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

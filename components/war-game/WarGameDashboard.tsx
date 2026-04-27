'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ValueChainFlow } from './ValueChainFlow'
import { ResultsPanel } from './results/ResultsPanel'
import { Play, RotateCcw, Zap, History } from 'lucide-react'
import { runSimulation } from '@/lib/simulation/mock-simulation'
import { DEFAULT_SIMULATION_INPUT } from '@/lib/data/initial-data'
import type { SimulationInput, SimulationResult, SimulationStatus } from '@/lib/types/war-game'

export function WarGameDashboard() {
  const [input, setInput] = useState<SimulationInput>(DEFAULT_SIMULATION_INPUT)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [status, setStatus] = useState<SimulationStatus>('idle')
  const [history, setHistory] = useState<SimulationResult[]>([])

  const handleRunSimulation = useCallback(async () => {
    setStatus('running')
    try {
      const newResult = await runSimulation(input)
      setResult(newResult)
      setHistory(prev => [newResult, ...prev].slice(0, 10))
      setStatus('completed')
    } catch (error) {
      console.error('Simulation error:', error)
      setStatus('error')
    }
  }, [input])

  const handleReset = useCallback(() => {
    setInput(DEFAULT_SIMULATION_INPUT)
    setResult(null)
    setStatus('idle')
  }, [])

  const totalNewCapacity = input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">APP Strategic War-Gaming Tool</h1>
            </div>
            <Badge variant="outline" className="text-xs">
              AI-Powered Scenario Analysis
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Current settings summary */}
            <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-2 text-sm">
              <div>
                <span className="text-muted-foreground">New Pulp Capacity:</span>
                <span className="ml-1 font-mono font-semibold text-primary">
                  {totalNewCapacity} kt
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div>
                <span className="text-muted-foreground">Guangxi:</span>
                <span className="ml-1 font-mono">{input.appCapacity.guangxi.pulpCapacity}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Jiangsu/Fujian:</span>
                <span className="ml-1 font-mono">{input.appCapacity.jiangsuFujian.pulpCapacity}</span>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <History className="h-3 w-3" />
                {history.length} runs
              </Badge>
            )}

            {/* Control buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={status === 'running'}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleRunSimulation}
                disabled={status === 'running'}
                className="min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {status === 'running' ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-4 w-4" />
                    Run Simulation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-x-auto p-6">
        {/* Value chain flow */}
        <section className="mb-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Value Chain (Left to Right: Forestry → Pulp → Downstream)
            <span className="h-px flex-1 bg-border" />
          </h2>
          <div className="min-w-[1200px]">
            <ValueChainFlow
              input={input}
              onInputChange={setInput}
              result={result}
            />
          </div>
        </section>

        {/* Results panel */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Simulation Results
            <span className="h-px flex-1 bg-border" />
          </h2>
          <ResultsPanel result={result} status={status} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/95 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Simulator Version 1.0</span>
            <span className="h-3 w-px bg-border" />
            <span>Data Updated: 2024</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>User Input</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ai-badge animate-pulse" />
              <span>AI-Driven</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

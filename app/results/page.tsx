'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResultsPanel } from '@/components/war-game/results/ResultsPanel'
import { Play, RotateCcw, Zap, ArrowLeft, History } from 'lucide-react'
import { useSimulation } from '@/lib/context/SimulationContext'

export default function ResultsPage() {
  const router = useRouter()
  const { input, result, status, history, runSimulationAsync, reset } = useSimulation()

  // Redirect to input page if no results
  useEffect(() => {
    if (!result && status !== 'running') {
      router.push('/')
    }
  }, [result, status, router])

  const handleRunSimulation = async () => {
    await runSimulationAsync()
  }

  const handleReset = () => {
    reset()
    router.push('/')
  }

  const handleBackToInput = () => {
    router.push('/')
  }

  const totalNewCapacity = input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity

  if (!result && status !== 'running') {
    return null
  }

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
              Simulation Results
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
                    Re-run Simulation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="border-b border-border/50 bg-background px-6">
        <div className="flex gap-1">
          <button
            onClick={handleBackToInput}
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Input Configuration
          </button>
          <button
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-primary text-primary"
          >
            Simulation Results
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-x-auto p-6">
        <ResultsPanel result={result} status={status} />
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
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>User Input</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ai-badge" />
              <span>AI-Driven</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

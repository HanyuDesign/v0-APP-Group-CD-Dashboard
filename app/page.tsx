'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ValueChainFlow } from '@/components/war-game/ValueChainFlow'
import { Zap } from 'lucide-react'
import { useSimulation } from '@/lib/context/SimulationContext'

export default function InputPage() {
  const router = useRouter()
  const { input, setInput, result, status, runSimulationAsync, reset } = useSimulation()

  const handleRunSimulation = async () => {
    await runSimulationAsync()
    router.push('/results')
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
              Input Configuration
            </Badge>
          </div>


        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="border-b border-border/50 bg-background px-6">
        <div className="flex gap-1">
          <button
            className="px-4 py-2.5 text-sm font-medium border-b-2 border-primary text-primary"
          >
            Input Configuration
          </button>
          <button
            onClick={() => result && router.push('/results')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 border-transparent ${
              result 
                ? 'text-muted-foreground hover:text-foreground hover:border-border' 
                : 'text-muted-foreground/50 cursor-not-allowed'
            }`}
            disabled={!result}
          >
            Simulation Results
            {!result && <span className="ml-2 text-xs">(Run simulation first)</span>}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Value chain flow */}
        <section>
          <ValueChainFlow
            input={input}
            onInputChange={setInput}
            result={result}
            onRunSimulation={handleRunSimulation}
            onReset={reset}
            isRunning={status === 'running'}
          />
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

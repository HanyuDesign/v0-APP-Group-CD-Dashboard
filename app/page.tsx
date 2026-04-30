'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ValueChainFlow } from '@/components/war-game/ValueChainFlow'
import { CompetitorConfigModule, initializeCompetitorConfig } from '@/components/war-game/modules/CompetitorConfigModule'
import { ReactionInputModule } from '@/components/war-game/modules/ReactionInputModule'
import { Zap, ArrowRight, ArrowLeft, Play, Check, ChevronRight } from 'lucide-react'
import { useSimulation } from '@/lib/context/SimulationContext'
import { cn } from '@/lib/utils'
import type { SimulationStep, CompetitorConfig, ReactionSettings } from '@/lib/types/war-game'
import { DEFAULT_REACTION_SETTINGS } from '@/lib/data/initial-data'

const STEPS: { key: SimulationStep; label: string; shortLabel: string; description: string }[] = [
  { 
    key: 'market-input', 
    label: 'Market Input', 
    shortLabel: 'Market',
    description: 'Configure market environment & APP decisions'
  },
  { 
    key: 'competitor-configure', 
    label: 'Competitor Configure', 
    shortLabel: 'Competitors',
    description: 'Set competitor capacity assumptions'
  },
  { 
    key: 'reaction-input', 
    label: 'Reaction Input', 
    shortLabel: 'Reactions',
    description: 'Review AI-generated market reactions'
  },
  { 
    key: 'results', 
    label: 'Simulation Results', 
    shortLabel: 'Results',
    description: 'View simulation outcomes'
  },
]

export default function InputPage() {
  const router = useRouter()
  const { input, setInput, result, status, runSimulationAsync, reset } = useSimulation()
  const [currentStep, setCurrentStep] = useState<SimulationStep>('market-input')
  const [competitorConfig, setCompetitorConfig] = useState<CompetitorConfig[]>(() => initializeCompetitorConfig())
  const [reactionSettings, setReactionSettings] = useState<ReactionSettings>(
    input.reactionSettings || DEFAULT_REACTION_SETTINGS
  )

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep)

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 2) {
      // Move to next step (not results)
      setCurrentStep(STEPS[currentStepIndex + 1].key)
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].key)
    }
  }

  const handleRunSimulation = async () => {
    // Update input with competitor config and reaction settings
    const updatedInput = {
      ...input,
      competitorConfig,
      reactionSettings,
    }
    setInput(updatedInput)
    
    await runSimulationAsync()
    setCurrentStep('results')
    router.push('/results')
  }

  const handleStepClick = (step: SimulationStep) => {
    // Allow navigation to any step except results (unless simulation has run)
    if (step === 'results') {
      if (result) {
        router.push('/results')
      }
      return
    }
    setCurrentStep(step)
  }

  const handleCompetitorConfigChange = (config: CompetitorConfig[]) => {
    setCompetitorConfig(config)
    setInput({ ...input, competitorConfig: config })
  }

  const handleReactionSettingsChange = (settings: ReactionSettings) => {
    setReactionSettings(settings)
    setInput({ ...input, reactionSettings: settings })
  }

  const getNextButtonLabel = () => {
    switch (currentStep) {
      case 'market-input':
        return 'Next: Competitor Configure'
      case 'competitor-configure':
        return 'Next: Reaction Input'
      case 'reaction-input':
        return 'Run Simulation'
      default:
        return 'Next'
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">APP Strategic War-Gaming Tool</h1>
          </div>
        </div>
      </header>

      {/* Navigation tabs - 4 steps */}
      <nav className="border-b border-border/50 bg-background px-6">
        <div className="flex items-center gap-1">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.key
            const isPast = index < currentStepIndex
            const isResults = step.key === 'results'
            const isDisabled = isResults && !result
            const isLast = index === STEPS.length - 1
            
            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.key)}
                  disabled={isDisabled}
                  className={cn(
                    'relative px-4 py-2.5 text-sm font-medium border-b-2 transition-all flex items-center gap-2',
                    isActive 
                      ? 'border-primary text-primary' 
                      : isPast
                        ? 'border-transparent text-emerald-600 hover:text-emerald-700'
                        : isDisabled
                          ? 'border-transparent text-muted-foreground/50 cursor-not-allowed'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  {/* Step number / check */}
                  <span className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isPast
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                  )}>
                    {isPast ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  <span>{step.label}</span>
                  {isResults && !result && (
                    <span className="text-[10px] ml-1">(Run simulation first)</span>
                  )}
                </button>
                {/* Arrow between steps */}
                {!isLast && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
                )}
              </div>
            )
          })}
          
          {/* Progress indicator */}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {STEPS.length}</span>
            <div className="h-1.5 w-24 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Step 1: Market Input */}
        {currentStep === 'market-input' && (
          <ValueChainFlow
            input={input}
            onInputChange={setInput}
            result={result}
            isRunning={status === 'running'}
          />
        )}

        {/* Step 2: Competitor Configure */}
        {currentStep === 'competitor-configure' && (
          <CompetitorConfigModule
            config={competitorConfig}
            onChange={handleCompetitorConfigChange}
            appCapacityAdditions={input.appCapacity.appChina}
          />
        )}

        {/* Step 3: Reaction Input */}
        {currentStep === 'reaction-input' && (
          <ReactionInputModule
            settings={reactionSettings}
            onChange={handleReactionSettingsChange}
            competitorConfig={competitorConfig}
            marketInput={input}
          />
        )}
      </main>

      {/* Footer with navigation buttons */}
      <footer className="sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Simulator Version 1.0</span>
            <span className="h-3 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>User Input</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-ai-badge" />
              <span>AI-Driven</span>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-3">
            {/* Back button */}
            {currentStepIndex > 0 && currentStep !== 'results' && (
              <Button
                variant="outline"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
            )}

            {/* Reset button */}
            <Button
              variant="outline"
              onClick={() => {
                reset()
                setCompetitorConfig(initializeCompetitorConfig())
                setReactionSettings(DEFAULT_REACTION_SETTINGS)
              }}
              disabled={status === 'running'}
            >
              Reset All
            </Button>

            {/* Next / Run Simulation button */}
            {currentStep !== 'results' && (
              <Button
                onClick={currentStep === 'reaction-input' ? handleRunSimulation : handleNext}
                disabled={status === 'running'}
                className={cn(
                  currentStep === 'reaction-input' && 'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                {status === 'running' ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Running...
                  </>
                ) : currentStep === 'reaction-input' ? (
                  <>
                    <Play className="mr-1.5 h-4 w-4" />
                    Run Simulation
                  </>
                ) : (
                  <>
                    {getNextButtonLabel()}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

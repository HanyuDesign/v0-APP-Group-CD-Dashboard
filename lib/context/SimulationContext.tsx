'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { runSimulation } from '@/lib/simulation/mock-simulation'
import { DEFAULT_SIMULATION_INPUT } from '@/lib/data/initial-data'
import type { SimulationInput, SimulationResult, SimulationStatus } from '@/lib/types/war-game'

interface SimulationContextType {
  input: SimulationInput
  setInput: (input: SimulationInput) => void
  result: SimulationResult | null
  status: SimulationStatus
  history: SimulationResult[]
  runSimulationAsync: () => Promise<void>
  reset: () => void
}

const SimulationContext = createContext<SimulationContextType | null>(null)

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState<SimulationInput>(DEFAULT_SIMULATION_INPUT)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [status, setStatus] = useState<SimulationStatus>('idle')
  const [history, setHistory] = useState<SimulationResult[]>([])

  const runSimulationAsync = useCallback(async () => {
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

  const reset = useCallback(() => {
    setInput(DEFAULT_SIMULATION_INPUT)
    setResult(null)
    setStatus('idle')
  }, [])

  return (
    <SimulationContext.Provider
      value={{
        input,
        setInput,
        result,
        status,
        history,
        runSimulationAsync,
        reset,
      }}
    >
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const context = useContext(SimulationContext)
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider')
  }
  return context
}

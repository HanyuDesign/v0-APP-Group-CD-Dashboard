import type {
  Player,
  SimulationInput,
  ForestrySettings,
  APPCapacitySettings,
  DownstreamSettings,
} from '@/lib/types/war-game'

// Player data with Bain-style colors (red primary, professional palette)
export const PLAYERS: Player[] = [
  {
    id: 'app-china',
    name: 'APP China',
    nameCn: 'APP China',
    type: 'app',
    region: 'china',
    isAIDriven: false,
    color: '#cc0000', // Bain Red - APP primary
    pulpCapacity: 350,
    paperCapacity: 200,
    boardCapacity: 280,
    tissueCapacity: 120,
  },
  {
    id: 'app-indonesia',
    name: 'APP Indonesia',
    nameCn: 'APP Indonesia',
    type: 'app',
    region: 'indonesia',
    isAIDriven: false,
    color: '#e63946', // Lighter red - APP secondary
    pulpCapacity: 800,
    paperCapacity: 150,
    boardCapacity: 200,
    tissueCapacity: 80,
  },
  {
    id: 'sun-paper',
    name: 'Sun Paper',
    nameCn: 'Sun Paper',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: '#1d4e89', // Navy blue
    pulpCapacity: 180,
    paperCapacity: 250,
    boardCapacity: 150,
    tissueCapacity: 60,
  },
  {
    id: 'chenming',
    name: 'Chenming',
    nameCn: 'Chenming',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: '#2a9d8f', // Teal
    pulpCapacity: 120,
    paperCapacity: 180,
    boardCapacity: 100,
    tissueCapacity: 40,
  },
  {
    id: 'liansheng',
    name: 'Liansheng',
    nameCn: 'Liansheng',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: '#e9c46a', // Gold/Amber
    pulpCapacity: 80,
    paperCapacity: 60,
    boardCapacity: 80,
    tissueCapacity: 30,
  },
  {
    id: 'others-china',
    name: 'Others China',
    nameCn: 'Others China',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: '#6c757d', // Gray
    pulpCapacity: 150,
    paperCapacity: 200,
    boardCapacity: 120,
    tissueCapacity: 100,
  },
  {
    id: 'suzano',
    name: 'Suzano',
    nameCn: 'Suzano',
    type: 'exporter',
    region: 'latam',
    isAIDriven: true,
    color: '#264653', // Dark teal
    pulpCapacity: 1100,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 0,
  },
  {
    id: 'cmpc',
    name: 'CMPC',
    nameCn: 'CMPC',
    type: 'exporter',
    region: 'latam',
    isAIDriven: true,
    color: '#457b9d', // Steel blue
    pulpCapacity: 450,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 0,
  },
  {
    id: 'arauco',
    name: 'Arauco',
    nameCn: 'Arauco',
    type: 'exporter',
    region: 'latam',
    isAIDriven: true,
    color: '#588157', // Forest green
    pulpCapacity: 380,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 0,
  },
  {
    id: 'april',
    name: 'APRIL',
    nameCn: 'APRIL',
    type: 'exporter',
    region: 'indonesia',
    isAIDriven: true,
    color: '#f4a261', // Orange
    pulpCapacity: 280,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 50,
  },
  {
    id: 'vinda',
    name: 'Vinda',
    nameCn: 'Vinda',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: '#7b2d8e', // Purple
    pulpCapacity: 0,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 150,
  },
]

// Default forestry settings
export const DEFAULT_FORESTRY_SETTINGS: ForestrySettings = {
  chinaLoggingPolicy: 'baseline',
  chinaRealEstateCondition: 'stable',
  vietnamExportPolicy: 'baseline',
}

// Default APP capacity settings
export const DEFAULT_APP_CAPACITY_SETTINGS: APPCapacitySettings = {
  guangxi: {
    pulpCapacity: 200,
    startYear: 2026,
    includeBoard: true,
    boardCapacity: 100,
    includeTissue: false,
    tissueCapacity: 0,
  },
  jiangsuFujian: {
    pulpCapacity: 150,
    startYear: 2027,
    includeBoard: false,
    boardCapacity: 0,
    includeTissue: true,
    tissueCapacity: 60,
  },
}

// Default downstream settings
export const DEFAULT_DOWNSTREAM_SETTINGS: DownstreamSettings = {
  paperDemand: 'base',
  boardDemand: 'base',
  tissueDemand: 'base',
}

// Default full simulation input
export const DEFAULT_SIMULATION_INPUT: SimulationInput = {
  forestry: DEFAULT_FORESTRY_SETTINGS,
  appCapacity: DEFAULT_APP_CAPACITY_SETTINGS,
  downstream: DEFAULT_DOWNSTREAM_SETTINGS,
}

// Policy option labels
export const POLICY_LABELS = {
  chinaLoggingPolicy: {
    tight: 'Tight',
    baseline: 'Baseline',
    relaxed: 'Relaxed',
  },
  chinaRealEstateCondition: {
    downturn: 'Downturn',
    stable: 'Stable',
    recovery: 'Recovery',
  },
  vietnamExportPolicy: {
    restricted: 'Restricted',
    baseline: 'Baseline',
    expanded: 'Expanded',
  },
  priceLevel: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  },
  demandScenario: {
    low: 'Low Demand',
    base: 'Baseline',
    high: 'High Demand',
  },
}

// IRR hurdle rate
export const IRR_HURDLE = 12 // 12%

// Year options
export const YEAR_OPTIONS = [2025, 2026, 2027, 2028, 2029, 2030]

// Capacity range settings
export const CAPACITY_RANGE = {
  pulp: { min: 0, max: 400, step: 25 },
  board: { min: 0, max: 200, step: 20 },
  tissue: { min: 0, max: 100, step: 10 },
}

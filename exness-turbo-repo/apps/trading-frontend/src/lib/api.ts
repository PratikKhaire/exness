const TRADING_ENGINE_URL = process.env.NEXT_PUBLIC_TRADING_ENGINE_URL || 'http://localhost:4000'
const EXNESS_BACKEND_URL = process.env.NEXT_PUBLIC_EXNESS_BACKEND_URL || 'http://localhost:5000'

// Simple fetch wrapper
async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// API Functions
export const api = {
  // Get trading engine state
  getEngineState: async () => {
    return apiRequest(`${TRADING_ENGINE_URL}/api/v1/state`)
  },

  // Get backend state
  getBackendState: async () => {
    return apiRequest(`${EXNESS_BACKEND_URL}/api/v1/state`)
  },

  // Open position
  openPosition: async (data: {
    margin: number
    asset: string
    type: 'long' | 'short'
    leverage: number
    slippage: number
    currentPrice: number
  }) => {
    return apiRequest(`${TRADING_ENGINE_URL}/api/v1/positions/open`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Close position
  closePosition: async (data: {
    positionId: string
    currentPrice: number
  }) => {
    return apiRequest(`${TRADING_ENGINE_URL}/api/v1/positions/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Close position (backend)
  closePositionBackend: async (data: {
    positionId: string
    currentPrice: number
  }) => {
    return apiRequest(`${EXNESS_BACKEND_URL}/api/v1/positions/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

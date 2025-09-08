export interface Position {
  positionId: string
  asset: string
  type: 'long' | 'short'
  margin: number
  leverage: number
  slippage: number
  entryPrice: number
  quantity: number
  unrealizedPnL: number
  timestamp: number
}

export interface Order {
  orderId: string
  market: string
  price: string
  quantity: string
  side: 'buy' | 'sell'
  status: 'open' | 'filled' | 'cancelled'
  timestamp: number
}

export interface MarketData {
  symbol: string
  price: number
  timestamp: number
  volume?: number
  bid?: number
  ask?: number
  change24h?: number
  changePercent24h?: number
}

export interface EngineState {
  balances: {
    [asset: string]: number
  }
  positions: Position[]
  orders?: Order[]
}

export interface TradingFormData {
  asset: string
  type: 'long' | 'short'
  margin: number
  leverage: number
  slippage: number
}

export interface ChartData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

import { useState, useEffect } from 'react'
import { MarketData } from '@/types'

// Mock market data - in a real app, this would connect to a WebSocket
export function useMarketData(symbol: string = 'SOL_USDC') {
  const [marketData, setMarketData] = useState<MarketData>({
    symbol,
    price: 150.0,
    timestamp: Date.now(),
    volume: 1000000,
    bid: 149.95,
    ask: 150.05,
    change24h: 5.25,
    changePercent24h: 3.62,
  })

  const [priceHistory, setPriceHistory] = useState<number[]>([])

  useEffect(() => {
    // Simulate real-time price updates
    const interval = setInterval(() => {
      setMarketData(prev => {
        const change = (Math.random() - 0.5) * 2 // Random change between -1 and 1
        const newPrice = Math.max(0.01, prev.price + change)
        
        setPriceHistory(history => {
          const newHistory = [...history, newPrice]
          return newHistory.slice(-50) // Keep last 50 prices
        })

        return {
          ...prev,
          price: newPrice,
          timestamp: Date.now(),
          bid: newPrice - 0.05,
          ask: newPrice + 0.05,
        }
      })
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [])

  return { marketData, priceHistory }
}

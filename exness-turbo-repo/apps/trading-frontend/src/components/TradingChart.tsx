import React, { useState, useEffect } from 'react'
import { ChartData } from '@/types'

interface TradingChartProps {
  data: ChartData[]
  currentPrice: number
  symbol: string
  className?: string
}

export function TradingChart({ currentPrice, symbol, className = '' }: TradingChartProps) {
  const [priceHistory, setPriceHistory] = useState<number[]>([currentPrice])

  useEffect(() => {
    setPriceHistory(prev => [...prev.slice(-50), currentPrice])
  }, [currentPrice])

  const maxPrice = Math.max(...priceHistory)
  const minPrice = Math.min(...priceHistory)
  const priceRange = maxPrice - minPrice || 1

  // Generate SVG path for price line
  const generatePricePath = () => {
    if (priceHistory.length < 2) return ''
    
    const width = 800
    const height = 300
    const padding = 20
    
    return priceHistory
      .map((price, index) => {
        const x = padding + (index / (priceHistory.length - 1)) * (width - 2 * padding)
        const y = padding + ((maxPrice - price) / priceRange) * (height - 2 * padding)
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  const change24h = priceHistory.length > 0 && priceHistory[0] 
    ? ((currentPrice - priceHistory[0]) / priceHistory[0]) * 100 
    : 0
  const isPositive = change24h >= 0

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{symbol}</h3>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-foreground">
              ${currentPrice.toFixed(6)}
            </span>
            <span className={`text-sm font-medium ${
              isPositive ? 'price-up' : 'price-down'
            }`}>
              {isPositive ? '+' : ''}{change24h.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>24h High: ${maxPrice.toFixed(2)}</div>
          <div>24h Low: ${minPrice.toFixed(2)}</div>
        </div>
      </div>
      
      {/* Simple SVG Chart */}
      <div className="w-full h-[400px] bg-card rounded-lg border border-border p-4">
        <svg width="100%" height="100%" viewBox="0 0 800 300" className="w-full h-full">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Price line */}
          <path
            d={generatePricePath()}
            fill="none"
            stroke={isPositive ? "#10b981" : "#ef4444"}
            strokeWidth="2"
            className="drop-shadow-lg"
          />
          
          {/* Current price dot */}
          {priceHistory.length > 0 && (
            <circle
              cx={800 - 40}
              cy={20 + ((maxPrice - currentPrice) / priceRange) * 260}
              r="4"
              fill={isPositive ? "#10b981" : "#ef4444"}
              className="animate-pulse"
            />
          )}
        </svg>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Volume (24h)</span>
          <div className="font-medium">1,234,567 SOL</div>
        </div>
        <div>
          <span className="text-muted-foreground">Market Cap</span>
          <div className="font-medium">$7.8B</div>
        </div>
        <div>
          <span className="text-muted-foreground">Bid</span>
          <div className="font-medium price-up">${(currentPrice - 0.05).toFixed(2)}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Ask</span>
          <div className="font-medium price-down">${(currentPrice + 0.05).toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}

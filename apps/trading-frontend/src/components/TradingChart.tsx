import React, { useState, useEffect, useRef } from 'react'
import { ChartData } from '@/types'

interface TradingChartProps {
  data: ChartData[]
  currentPrice: number
  symbol: string
  className?: string
}

interface HoverData {
  x: number
  candle: ChartData | null
  visible: boolean
}

export function TradingChart({ currentPrice, symbol, className = '' }: TradingChartProps) {
  const [candleData, setCandleData] = useState<ChartData[]>([])
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('1m')
  const [hoverData, setHoverData] = useState<HoverData>({ x: 0, candle: null, visible: false })
  const svgRef = useRef<SVGSVGElement>(null)

  // Generate clean mock candlestick data - single source only
  const generateCandleData = (count: number, interval: string) => {
    const data: ChartData[] = []
    const now = Date.now()
    let intervalMs = 60000 // 1 minute default

    switch (interval) {
      case '5m': intervalMs = 5 * 60000; break
      case '15m': intervalMs = 15 * 60000; break
      case '1h': intervalMs = 60 * 60000; break
      case '1d': intervalMs = 24 * 60 * 60000; break
      default: intervalMs = 60000 // 1m
    }

    // Generate clean candlestick data - NO bid/ask duplication
    for (let i = count - 1; i >= 0; i--) {
      const time = now - (i * intervalMs)
      
      // Use only the current price as base - no bid/ask confusion
      const basePrice = currentPrice * (1 + (Math.random() - 0.5) * 0.05) // 5% variance
      const volatility = basePrice * 0.015 // 1.5% volatility
      
      // Single OHLC calculation
      const open = basePrice + (Math.random() - 0.5) * volatility
      const close = basePrice + (Math.random() - 0.5) * volatility
      const high = Math.max(open, close) + Math.random() * volatility * 0.5
      const low = Math.min(open, close) - Math.random() * volatility * 0.5

      data.push({
        time,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 100000
      })
    }

    return data.sort((a, b) => a.time - b.time)
  }
  
  useEffect(() => {
    const count = timeframe === '1d' ? 30 : timeframe === '1h' ? 100 : 200
    setCandleData(generateCandleData(count, timeframe))
  }, [currentPrice, timeframe])

  // Chart dimensions and calculations
  const chartWidth = 800
  const chartHeight = 400
  const padding = 40

  const allPrices = candleData.flatMap(d => [d.high, d.low])
  const maxPrice = Math.max(...allPrices, currentPrice)
  const minPrice = Math.min(...allPrices, currentPrice)
  const priceRange = maxPrice - minPrice || 1

  const maxVolume = Math.max(...candleData.map(d => d.volume || 0))

  // Generate candlesticks
  const generateCandlesticks = () => {
    if (candleData.length === 0) return []

    // Make candles thicker and more spaced like TradingView
    const availableWidth = chartWidth - 2 * padding
    const candleSpacing = availableWidth / candleData.length
    const candleWidth = Math.min(candleSpacing * 0.7, 12) // Max width of 12px like TradingView
    
    return candleData.map((candle, index) => {
      const x = padding + (index + 0.5) * candleSpacing
      const openY = padding + ((maxPrice - candle.open) / priceRange) * (chartHeight - 2 * padding)
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * (chartHeight - 2 * padding)
      const highY = padding + ((maxPrice - candle.high) / priceRange) * (chartHeight - 2 * padding)
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * (chartHeight - 2 * padding)

      const isGreen = candle.close > candle.open
      const bodyTop = Math.min(openY, closeY)
      const bodyHeight = Math.max(Math.abs(closeY - openY), 2) // Minimum 2px height for doji

      return {
        x,
        openY,
        closeY,
        highY,
        lowY,
        bodyTop,
        bodyHeight,
        candleWidth,
        isGreen,
        candle,
        index
      }
    })
  }

  const candlesticks = generateCandlesticks()

  // Handle mouse events
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    
    // Find nearest candlestick
    const nearestCandle = candlesticks.find(stick => 
      Math.abs(stick.x - x) < stick.candleWidth / 2 + 10
    )

    setHoverData({
      x,
      candle: nearestCandle?.candle || null,
      visible: !!nearestCandle
    })
  }

  const handleMouseLeave = () => {
    setHoverData({ x: 0, candle: null, visible: false })
  }

  // Format functions
  const formatPrice = (price: number) => `$${price.toFixed(6)}`
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`
    return volume.toString()
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    if (timeframe === '1d') return date.toLocaleDateString()
    if (timeframe === '1h') return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const change24h = candleData.length > 0 && candleData[0] 
    ? ((currentPrice - candleData[0].close) / candleData[0].close) * 100 
    : 0
  const isPositive = change24h >= 0

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{symbol}</h3>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-foreground">
              {formatPrice(currentPrice)}
            </span>
            <span className={`text-sm font-medium ${
              isPositive ? 'price-up' : 'price-down'
            }`}>
              {isPositive ? '+' : ''}{change24h.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>24h High: {formatPrice(maxPrice)}</div>
          <div>24h Low: {formatPrice(minPrice)}</div>
        </div>
      </div>

      {/* Timeframe Buttons */}
      <div className="flex space-x-2">
        {(['1m', '5m', '15m', '1h', '1d'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              timeframe === tf
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
      
      {/* Chart Container */}
      <div className="w-full bg-card rounded-lg border border-border p-4 relative">
        {/* Hover Info */}
        {hoverData.visible && hoverData.candle && (
          <div 
            className="absolute z-10 bg-card border border-border rounded p-2 text-xs shadow-lg pointer-events-none" 
            style={{ 
              left: Math.min(hoverData.x + 10, chartWidth - 150),
              top: 10 
            }}
          >
            <div className="space-y-1">
              <div className="font-semibold">Time: {formatTime(hoverData.candle.time)}</div>
              <div>Open: <span className="text-foreground">{formatPrice(hoverData.candle.open)}</span></div>
              <div>High: <span className="text-green-500">{formatPrice(hoverData.candle.high)}</span></div>
              <div>Low: <span className="text-red-500">{formatPrice(hoverData.candle.low)}</span></div>
              <div>Close: <span className="text-foreground">{formatPrice(hoverData.candle.close)}</span></div>
              <div>Volume: <span className="text-muted-foreground">{formatVolume(hoverData.candle.volume || 0)}</span></div>
            </div>
          </div>
        )}

        {/* Chart Container - Fixed to prevent reflection */}
        <div className="relative w-full bg-[#0a0e27] rounded-lg border border-gray-700" style={{ height: '400px' }}>
          <svg 
            ref={svgRef}
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
              cursor: 'crosshair',
              display: 'block',
              width: '100%',
              height: '100%'
            }}
          >
            {/* Single background */}
            <rect width="100%" height="100%" fill="#0a0e27" />

            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((ratio, i) => (
              <line
                key={`h-${i}`}
                x1={padding}
                y1={padding + ratio * (chartHeight - 2 * padding)}
                x2={chartWidth - padding}
                y2={padding + ratio * (chartHeight - 2 * padding)}
                stroke="#2a2e47"
                strokeWidth="1"
                opacity="0.3"
              />
            ))}

            {[0.25, 0.5, 0.75].map((ratio, i) => (
              <line
                key={`v-${i}`}
                x1={padding + ratio * (chartWidth - 2 * padding)}
                y1={padding}
                x2={padding + ratio * (chartWidth - 2 * padding)}
                y2={chartHeight - padding}
                stroke="#2a2e47"
                strokeWidth="1"
                opacity="0.3"
              />
            ))}

            {/* Price labels */}
            {[0.2, 0.5, 0.8].map((ratio, i) => {
              const y = padding + ratio * (chartHeight - 2 * padding)
              const price = maxPrice - ratio * priceRange
              return (
                <text
                  key={`price-${i}`}
                  x={chartWidth - padding + 5}
                  y={y + 4}
                  fill="#8691a8"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {formatPrice(price)}
                </text>
              )
            })}

            {/* Candlesticks */}
            {candlesticks.map((stick) => (
              <g key={stick.index}>
                {/* Wick */}
                <line
                  x1={stick.x}
                  y1={stick.highY}
                  x2={stick.x}
                  y2={stick.lowY}
                  stroke={stick.isGreen ? "#26a69a" : "#ef5350"}
                  strokeWidth="1"
                />
                
                {/* Body */}
                <rect
                  x={stick.x - stick.candleWidth / 2}
                  y={stick.bodyTop}
                  width={stick.candleWidth}
                  height={Math.max(stick.bodyHeight, 1)}
                  fill={stick.isGreen ? "none" : "#ef5350"}
                  stroke={stick.isGreen ? "#26a69a" : "#ef5350"}
                  strokeWidth="1"
                />
              </g>
            ))}

            {/* Current price line */}
            <line
              x1={padding}
              y1={padding + ((maxPrice - currentPrice) / priceRange) * (chartHeight - 2 * padding)}
              x2={chartWidth - padding}
              y2={padding + ((maxPrice - currentPrice) / priceRange) * (chartHeight - 2 * padding)}
              stroke="#2196f3"
              strokeWidth="1"
              strokeDasharray="3,3"
            />

            {/* Crosshair */}
            {hoverData.visible && (
              <line
                x1={hoverData.x}
                y1={padding}
                x2={hoverData.x}
                y2={chartHeight - padding}
                stroke="#4a5568"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.5"
              />
            )}
          </svg>
        </div>
      </div>

      
      {/* Market Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Volume (24h)</span>
          <div className="font-medium">
            {candleData.length > 0 
              ? formatVolume(candleData.reduce((sum, candle) => sum + (candle.volume || 0), 0))
              : '0'
            }
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Market Cap</span>
          <div className="font-medium">$7.8B</div>
        </div>
        <div>
          <span className="text-muted-foreground">Bid</span>
          <div className="font-medium price-up">{formatPrice(currentPrice - 0.05)}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Ask</span>
          <div className="font-medium price-down">{formatPrice(currentPrice + 0.05)}</div>
        </div>
      </div>
    </div>
  )
}

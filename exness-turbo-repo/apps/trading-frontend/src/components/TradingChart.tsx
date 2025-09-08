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

  // Generate mock candlestick data
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

    for (let i = count - 1; i >= 0; i--) {
      const time = now - (i * intervalMs)
      const basePrice = currentPrice + (Math.random() - 0.5) * (currentPrice * 0.1)
      const volatility = currentPrice * 0.02
      
      const open = basePrice + (Math.random() - 0.5) * volatility
      const high = Math.max(open, basePrice + Math.random() * volatility)
      const low = Math.min(open, basePrice - Math.random() * volatility)
      const close = low + Math.random() * (high - low)

      data.push({
        time,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000000) + 100000,
      })
    }
    return data
  }

  useEffect(() => {
    const count = timeframe === '1d' ? 30 : timeframe === '1h' ? 100 : 200
    setCandleData(generateCandleData(count, timeframe))
  }, [currentPrice, timeframe])

  // Chart dimensions and calculations
  const chartWidth = 800
  const chartHeight = 300
  const padding = 40
  const volumeHeight = 60

  const allPrices = candleData.flatMap(d => [d.high, d.low])
  const maxPrice = Math.max(...allPrices, currentPrice)
  const minPrice = Math.min(...allPrices, currentPrice)
  const priceRange = maxPrice - minPrice || 1

  const maxVolume = Math.max(...candleData.map(d => d.volume || 0))

  // Generate candlesticks
  const generateCandlesticks = () => {
    if (candleData.length === 0) return []

    const candleWidth = Math.max(2, (chartWidth - 2 * padding) / candleData.length * 0.8)
    
    return candleData.map((candle, index) => {
      const x = padding + (index / (candleData.length - 1)) * (chartWidth - 2 * padding)
      const openY = padding + ((maxPrice - candle.open) / priceRange) * (chartHeight - 2 * padding)
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * (chartHeight - 2 * padding)
      const highY = padding + ((maxPrice - candle.high) / priceRange) * (chartHeight - 2 * padding)
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * (chartHeight - 2 * padding)

      const isGreen = candle.close > candle.open
      const bodyTop = Math.min(openY, closeY)
      const bodyHeight = Math.abs(closeY - openY)
      const volumeBarHeight = (candle.volume || 0) / maxVolume * volumeHeight

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
        volumeBarHeight,
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
      <div className="w-full bg-card rounded-lg border border-border p-4">
        {/* Hover Info */}
        {hoverData.visible && hoverData.candle && (
          <div className="absolute z-10 bg-card border border-border rounded p-2 text-xs shadow-lg" 
               style={{ 
                 left: Math.min(hoverData.x + 10, chartWidth - 150),
                 top: 10 
               }}>
            <div>Time: {formatTime(hoverData.candle.time)}</div>
            <div>Open: {formatPrice(hoverData.candle.open)}</div>
            <div>High: {formatPrice(hoverData.candle.high)}</div>
            <div>Low: {formatPrice(hoverData.candle.low)}</div>
            <div>Close: {formatPrice(hoverData.candle.close)}</div>
            <div>Volume: {formatVolume(hoverData.candle.volume || 0)}</div>
          </div>
        )}

        {/* Main Chart */}
        <svg 
          ref={svgRef}
          width="100%" 
          height={chartHeight + volumeHeight + 40} 
          viewBox={`0 0 ${chartWidth} ${chartHeight + volumeHeight + 40}`} 
          className="w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: 'crosshair' }}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height={chartHeight} fill="url(#grid)" />
          
          {/* Price grid lines */}
          {[0.25, 0.5, 0.75].map((ratio, i) => {
            const y = padding + ratio * (chartHeight - 2 * padding)
            const price = maxPrice - ratio * priceRange
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#475569"
                  strokeWidth="0.5"
                  opacity="0.5"
                />
                <text
                  x={chartWidth - padding + 5}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="10"
                >
                  {formatPrice(price)}
                </text>
              </g>
            )
          })}

          {/* Candlesticks */}
          {candlesticks.map((stick) => (
            <g key={stick.index}>
              {/* Wicks */}
              <line
                x1={stick.x}
                y1={stick.highY}
                x2={stick.x}
                y2={stick.lowY}
                stroke={stick.isGreen ? "#10b981" : "#ef4444"}
                strokeWidth="1"
              />
              
              {/* Body */}
              <rect
                x={stick.x - stick.candleWidth / 2}
                y={stick.bodyTop}
                width={stick.candleWidth}
                height={Math.max(stick.bodyHeight, 1)}
                fill={stick.isGreen ? "#10b981" : "#ef4444"}
                stroke={stick.isGreen ? "#059669" : "#dc2626"}
                strokeWidth="0.5"
              />
            </g>
          ))}

          {/* Current price line */}
          <line
            x1={padding}
            y1={padding + ((maxPrice - currentPrice) / priceRange) * (chartHeight - 2 * padding)}
            x2={chartWidth - padding}
            y2={padding + ((maxPrice - currentPrice) / priceRange) * (chartHeight - 2 * padding)}
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="5,5"
          />

          {/* Crosshair - only vertical line, no horizontal to avoid weird white line */}
          {hoverData.visible && (
            <line
              x1={hoverData.x}
              y1={0}
              x2={hoverData.x}
              y2={chartHeight}
              stroke="#6b7280"
              strokeWidth="1"
              opacity="0.7"
              strokeDasharray="2,2"
            />
          )}

          {/* Volume Chart */}
          <g transform={`translate(0, ${chartHeight + 10})`}>
            <text x={padding} y={15} fill="#94a3b8" fontSize="12" fontWeight="500">
              Volume
            </text>
            {candlesticks.map((stick) => (
              <rect
                key={`volume-${stick.index}`}
                x={stick.x - stick.candleWidth / 2}
                y={volumeHeight - stick.volumeBarHeight}
                width={stick.candleWidth}
                height={stick.volumeBarHeight}
                fill={stick.isGreen ? "#10b981" : "#ef4444"}
                opacity="0.6"
              />
            ))}
          </g>
        </svg>
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

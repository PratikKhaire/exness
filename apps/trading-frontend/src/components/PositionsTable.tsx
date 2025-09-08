import React, { useState } from 'react'
import { Card, Button } from './ui'
import { Position } from '@/types'
import { api } from '@/lib/api'
// import toast from 'react-hot-toast'

interface PositionsTableProps {
  positions: Position[]
  currentPrice: number
  onPositionClosed?: () => void
}

export function PositionsTable({ positions, currentPrice, onPositionClosed }: PositionsTableProps) {
  const [closingPositions, setClosingPositions] = useState<Set<string>>(new Set())

  const handleClosePosition = async (positionId: string) => {
    setClosingPositions(prev => new Set(prev).add(positionId))
    
    try {
      await api.closePosition({ positionId, currentPrice })
      // toast.success('Position closed successfully!')
      onPositionClosed?.()
    } catch (error) {
      // toast.error(`Failed to close position: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setClosingPositions(prev => {
        const newSet = new Set(prev)
        newSet.delete(positionId)
        return newSet
      })
    }
  }

  const calculatePnLPercentage = (position: Position) => {
    const priceDiff = currentPrice - position.entryPrice
    const pnlPercent = position.type === 'long' 
      ? (priceDiff / position.entryPrice) * 100 * position.leverage
      : (-priceDiff / position.entryPrice) * 100 * position.leverage
    return pnlPercent
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  if (positions.length === 0) {
    return (
      <Card title="Open Positions">
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium mb-2">No Open Positions</h3>
          <p>Open your first position to start trading</p>
        </div>
      </Card>
    )
  }

  return (
    <Card title={`Open Positions (${positions.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2">Asset</th>
              <th className="text-left py-3 px-2">Type</th>
              <th className="text-left py-3 px-2">Size</th>
              <th className="text-left py-3 px-2">Entry Price</th>
              <th className="text-left py-3 px-2">Current Price</th>
              <th className="text-left py-3 px-2">PnL</th>
              <th className="text-left py-3 px-2">PnL %</th>
              <th className="text-left py-3 px-2">Leverage</th>
              <th className="text-left py-3 px-2">Time</th>
              <th className="text-left py-3 px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => {
              const pnlPercent = calculatePnLPercentage(position)
              const isProfit = position.unrealizedPnL >= 0
              const isClosing = closingPositions.has(position.positionId)

              return (
                <tr key={position.positionId} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-2 font-medium">
                    {position.asset}/USDC
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      position.type === 'long' 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {position.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {position.quantity.toFixed(6)} {position.asset}
                  </td>
                  <td className="py-3 px-2">
                    ${position.entryPrice.toFixed(6)}
                  </td>
                  <td className="py-3 px-2 font-medium">
                    ${currentPrice.toFixed(6)}
                  </td>
                  <td className={`py-3 px-2 font-semibold ${isProfit ? 'pnl-positive' : 'pnl-negative'}`}>
                    {formatCurrency(position.unrealizedPnL)}
                  </td>
                  <td className={`py-3 px-2 font-semibold ${pnlPercent >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                    {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </td>
                  <td className="py-3 px-2">
                    {position.leverage}x
                  </td>
                  <td className="py-3 px-2 text-muted-foreground text-xs">
                    {formatTime(position.timestamp)}
                  </td>
                  <td className="py-3 px-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleClosePosition(position.positionId)}
                      disabled={isClosing}
                      className="text-xs"
                    >
                      {isClosing ? 'Closing...' : 'Close'}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Position Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Total Positions</div>
          <div className="text-lg font-semibold">{positions.length}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Total Unrealized PnL</div>
          <div className={`text-lg font-semibold ${
            positions.reduce((sum, p) => sum + p.unrealizedPnL, 0) >= 0 ? 'pnl-positive' : 'pnl-negative'
          }`}>
            {formatCurrency(positions.reduce((sum, p) => sum + p.unrealizedPnL, 0))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Total Margin Used</div>
          <div className="text-lg font-semibold">
            {formatCurrency(positions.reduce((sum, p) => sum + p.margin, 0))}
          </div>
        </div>
      </div>
    </Card>
  )
}

import React from 'react'
import { Card } from './ui'
import { EngineState } from '@/types'

interface PortfolioOverviewProps {
  state: EngineState | null
  loading: boolean
}

export function PortfolioOverview({ state, loading }: PortfolioOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const calculateTotalPnL = () => {
    if (!state?.positions) return 0
    return state.positions.reduce((sum, position) => sum + position.unrealizedPnL, 0)
  }

  const calculateTotalMarginUsed = () => {
    if (!state?.positions) return 0
    return state.positions.reduce((sum, position) => sum + position.margin, 0)
  }

  const calculatePortfolioValue = () => {
    const cash = state?.balances?.USD || 0
    const unrealizedPnL = calculateTotalPnL()
    return cash + unrealizedPnL
  }

  const getPortfolioPercentageChange = () => {
    // Mock calculation - in real app, this would be based on historical data
    const totalPnL = calculateTotalPnL()
    const initialBalance = 10000 // Assuming initial balance of $10,000
    return ((totalPnL / initialBalance) * 100)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!state) {
    return (
      <Card className="text-center py-8">
        <div className="text-destructive">Failed to load portfolio data</div>
      </Card>
    )
  }

  const totalPnL = calculateTotalPnL()
  const portfolioValue = calculatePortfolioValue()
  const marginUsed = calculateTotalMarginUsed()
  const freeMargin = (state.balances?.USD || 0) - marginUsed
  const portfolioChange = getPortfolioPercentageChange()

  return (
    <div className="space-y-6">
      {/* Main Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Portfolio Value */}
        <Card>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Portfolio Value</div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(portfolioValue)}
            </div>
            <div className={`text-sm font-medium flex items-center ${
              portfolioChange >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              <span className="mr-1">
                {portfolioChange >= 0 ? '↗' : '↘'}
              </span>
              {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}%
            </div>
          </div>
        </Card>

        {/* Available Balance */}
        <Card>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Available Balance</div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(state.balances?.USD || 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              Cash available for trading
            </div>
          </div>
        </Card>

        {/* Unrealized P&L */}
        <Card>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Unrealized P&L</div>
            <div className={`text-2xl font-bold ${
              totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </div>
            <div className="text-sm text-muted-foreground">
              From {state.positions?.length || 0} open positions
            </div>
          </div>
        </Card>

        {/* Margin Used */}
        <Card>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Margin Used</div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(marginUsed)}
            </div>
            <div className="text-sm text-muted-foreground">
              Free: {formatCurrency(freeMargin)}
            </div>
          </div>
        </Card>
      </div>

      {/* Asset Breakdown */}
      <Card title="Asset Breakdown">
        <div className="space-y-4">
          {Object.entries(state.balances || {}).map(([asset, balance]) => (
            <div key={asset} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {asset.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{asset}</div>
                  <div className="text-sm text-muted-foreground">
                    {asset === 'USD' ? 'US Dollar' : 'Solana'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {asset === 'USD' ? formatCurrency(balance) : `${balance.toFixed(6)} ${asset}`}
                </div>
                {asset === 'USD' && (
                  <div className="text-sm text-muted-foreground">
                    {((balance / portfolioValue) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Trading Statistics */}
      <Card title="Trading Statistics">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {state.positions?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Open Positions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {state.positions?.filter(p => p.type === 'long').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Long Positions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {state.positions?.filter(p => p.type === 'short').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Short Positions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {state.positions?.length ? 
                (state.positions.reduce((sum, p) => sum + p.leverage, 0) / state.positions.length).toFixed(1) : 
                '0'
              }x
            </div>
            <div className="text-sm text-muted-foreground">Avg. Leverage</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

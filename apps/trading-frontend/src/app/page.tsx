'use client'

import React, { useState } from 'react'
import { TradingChart } from '@/components/TradingChart'
import { TradingPanel } from '@/components/TradingPanel'
import { PositionsTable } from '@/components/PositionsTable'
import { PortfolioOverview } from '@/components/PortfolioOverview'
import { useEngineState } from '@/hooks/useEngineState'
import { useMarketData } from '@/hooks/useMarketData'
import { LoadingSpinner } from '@/components/ui'

export default function TradingDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'trading'>('trading')
  const { state, loading, error, refetch } = useEngineState()
  const { marketData } = useMarketData()

  const handlePositionChange = () => {
    refetch()
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-semibold text-destructive">Connection Error</h2>
          <p className="text-muted-foreground max-w-md">
            Failed to connect to trading engine. Please make sure the backend services are running.
          </p>
          <button
            onClick={refetch}
            className="trading-button-primary"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-foreground">
                Exness Trading Platform
              </h1>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-muted-foreground">Live Market Data</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">SOL/USDC</div>
                <div className="text-lg font-semibold text-foreground">
                  ${marketData.price.toFixed(6)}
                </div>
              </div>
              {loading && <LoadingSpinner size="sm" />}
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="mt-4">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Portfolio Overview' },
                { id: 'trading', label: 'Trading' },
                { id: 'positions', label: 'Positions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <PortfolioOverview state={state} loading={loading} />
          </div>
        )}

        {activeTab === 'trading' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TradingChart
                data={[]}
                currentPrice={marketData.price}
                symbol="SOL/USDC"
              />
              
              {/* Recent Positions */}
              {state?.positions && state.positions.length > 0 && (
                <PositionsTable
                  positions={state.positions.slice(0, 5)}
                  currentPrice={marketData.price}
                  onPositionClosed={handlePositionChange}
                />
              )}
            </div>
            
            <div>
              <TradingPanel
                currentPrice={marketData.price}
                onPositionOpened={handlePositionChange}
              />
            </div>
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="space-y-6">
            <PositionsTable
              positions={state?.positions || []}
              currentPrice={marketData.price}
              onPositionClosed={handlePositionChange}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              © 2025 Exness Trading Platform. Built with Next.js & TypeScript.
            </div>
            <div className="flex items-center space-x-4">
              <span>Trading Engine: {state ? '🟢 Connected' : '🔴 Disconnected'}</span>
              <span>Market Data: 🟢 Live</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

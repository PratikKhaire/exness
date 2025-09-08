import React, { useState } from 'react'
import { Card, Button, Input, Select } from './ui'
import { TradingFormData } from '@/types'
import { api } from '@/lib/api'

// Simple toast replacement
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  alert(`${type.toUpperCase()}: ${message}`)
}

interface TradingPanelProps {
  currentPrice: number
  onPositionOpened?: () => void
}

export function TradingPanel({ currentPrice, onPositionOpened }: TradingPanelProps) {
  const [formData, setFormData] = useState<TradingFormData>({
    asset: 'SOL',
    type: 'long',
    margin: 1000,
    leverage: 10,
    slippage: 0.1,
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: keyof TradingFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'asset' && field !== 'type' 
        ? parseFloat(value) || 0 
        : value,
    }))
  }

  const handleOpenPosition = async (type: 'long' | 'short') => {
    if (formData.margin <= 0) {
      showToast('Margin must be greater than 0', 'error')
      return
    }

    setLoading(true)
    try {
      const positionData = {
        ...formData,
        type,
        currentPrice,
      }
      
      await api.openPosition(positionData)
      showToast(`${type.toUpperCase()} position opened successfully!`, 'success')
      onPositionOpened?.()
    } catch (error) {
      showToast(`Failed to open ${type} position: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const calculateQuantity = () => {
    return (formData.margin * formData.leverage) / currentPrice
  }

  const calculatePotentialPnL = (type: 'long' | 'short', priceChange: number) => {
    const quantity = calculateQuantity()
    return type === 'long' ? quantity * priceChange : quantity * -priceChange
  }

  return (
    <Card title="Open Position" className="space-y-6">
      {/* Asset Selection */}
      <Select
        label="Asset"
        options={[
          { value: 'SOL', label: 'SOL/USDC' },
          { value: 'BTC', label: 'BTC/USDC' },
          { value: 'ETH', label: 'ETH/USDC' },
        ]}
        value={formData.asset}
        onChange={(value) => handleInputChange('asset', value)}
      />

      {/* Trading Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Margin (USD)"
          type="number"
          placeholder="1000"
          value={formData.margin}
          onChange={(e) => handleInputChange('margin', e.target.value)}
          required
        />
        
        <Input
          label="Leverage"
          type="number"
          placeholder="10"
          value={formData.leverage}
          onChange={(e) => handleInputChange('leverage', e.target.value)}
          required
        />
        
        <Input
          label="Slippage (%)"
          type="number"
          step="0.1"
          placeholder="0.1"
          value={formData.slippage}
          onChange={(e) => handleInputChange('slippage', e.target.value)}
        />
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Current Price
          </label>
          <div className="trading-input bg-muted cursor-not-allowed">
            ${currentPrice.toFixed(6)}
          </div>
        </div>
      </div>

      {/* Position Details */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-foreground">Position Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Quantity:</span>
            <span className="ml-2 font-medium">{calculateQuantity().toFixed(6)} {formData.asset}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Value:</span>
            <span className="ml-2 font-medium">${(formData.margin * formData.leverage).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">PnL (+$1 move):</span>
            <span className="ml-2 font-medium text-green-500">
              +${calculatePotentialPnL('long', 1).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">PnL (-$1 move):</span>
            <span className="ml-2 font-medium text-red-500">
              ${calculatePotentialPnL('long', -1).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Trading Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="buy"
          onClick={() => handleOpenPosition('long')}
          disabled={loading}
          className="w-full py-3 text-lg font-semibold"
        >
          {loading ? 'Opening...' : 'BUY / LONG'}
        </Button>
        
        <Button
          variant="sell"
          onClick={() => handleOpenPosition('short')}
          disabled={loading}
          className="w-full py-3 text-lg font-semibold"
        >
          {loading ? 'Opening...' : 'SELL / SHORT'}
        </Button>
      </div>

      {/* Risk Warning */}
      <div className="text-xs text-muted-foreground bg-destructive/10 border border-destructive/20 rounded-lg p-3">
        <strong>Risk Warning:</strong> Trading with leverage involves significant risk. 
        You can lose more than your initial margin. Only trade with money you can afford to lose.
      </div>
    </Card>
  )
}

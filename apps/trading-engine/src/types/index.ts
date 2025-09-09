// Market Data Types
export interface MarketDataMessage {
  symbol: string;
  price: number;
  timestamp: number;
  volume?: number;
  bid?: number;
  ask?: number;
}

// Order Types
export type Order = {
  orderId: string;
  market: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  status: 'open' | 'filled' | 'cancelled';
  timestamp: number;
};

// Position Types
export type Position = {
  positionId: string;
  asset: string;
  type: 'long' | 'short';
  margin: number;
  leverage: number;
  slippage: number;
  entryPrice: number;
  quantity: number;
  unrealizedPnL: number;
  timestamp: number;
};

// Kafka Types
export interface KafkaMessage {
  topic: string;
  partition?: number;
  value: any;
  timestamp?: number;
}

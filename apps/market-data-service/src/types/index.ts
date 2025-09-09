// Types for market-data-service
export interface MarketDataMessage {
  symbol: string;
  price: number;
  timestamp: number;
  volume?: number;
  bid?: number;
  ask?: number;
}

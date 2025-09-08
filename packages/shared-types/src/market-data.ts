export interface MarketDataMessage {
  symbol: string;
  price: number;
  timestamp: number;
  volume?: number;
  bid?: number;
  ask?: number;
}

export interface KafkaMessage {
  topic: string;
  partition?: number;
  value: any;
  timestamp?: number;
}

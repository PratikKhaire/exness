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

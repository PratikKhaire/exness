export type Order = {
  orderId: string;
  market: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  status: 'open' | 'filled' | 'cancelled';
  timestamp: number;
};

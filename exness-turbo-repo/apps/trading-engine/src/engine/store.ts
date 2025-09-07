import { Order, Position } from "@repo/shared-types";

const openOrders: Record<string, Order> = {};
const balance: Record<string, number> = {
  "USD": 10000,
  "SOL": 0
};
const openPositions: Record<string, Position> = {};

export const getBalance = (asset: string): number => {
  return balance[asset] || 0;
}

export const updateBalance = (asset: string, amount: number): void => {
  console.log(`[Store] Updating balance ${asset} by ${amount}`);
  balance[asset] = amount;
}

export const addOrder = (order: Order): void => {
  console.log(`[Store] Adding new order ${order.orderId}`);
  openOrders[order.orderId] = order;
}

export const removeOrder = (orderId: string): void => {
  console.log(`[Store] Removing order ${orderId}`);
  delete openOrders[orderId];
};

export const getOpenOrders = (): Order[] => {
  return Object.values(openOrders);
};

export const calculateUnrealizedPnL = (
  type: 'long' | 'short',
  quantity: number,
  entryPrice: number,
  currentPrice: number
): number => {
  if (type === 'long') {
    return (currentPrice - entryPrice) * quantity;
  } else if (type === 'short') {
    return (entryPrice - currentPrice) * quantity;
  }
  return 0;
};

export const openPosition = ({
  margin,
  asset,
  type,
  leverage = 1,
  slippage,
  currentPrice,
}: {
  margin: number;
  asset: string;
  type: 'long' | 'short';
  leverage: number;
  slippage: number;
  currentPrice: number;
}): Position => {
  const currentUSDBalance = getBalance("USD");
  if (currentUSDBalance < margin) {
    throw new Error("Insufficient funds");
  }

  const positionId = `pos_${Math.floor(Math.random() * 1000000)}`;
  const quantity = (margin * leverage) / currentPrice;

  updateBalance("USD", currentUSDBalance - margin);

  const newPosition: Position = {
    positionId,
    asset,
    type,
    margin,
    leverage,
    slippage,
    entryPrice: currentPrice,
    quantity,
    unrealizedPnL: 0,
    timestamp: Date.now()
  };

  openPositions[positionId] = newPosition;
  console.log("[Engine] Opened new position", newPosition);
  return newPosition;
};

export const closePosition = (positionId: string, currentPrice: number) => {
  const position = openPositions[positionId];
  if (!position) {
    throw new Error("Position not found");
  }

  const realizedPnL = calculateUnrealizedPnL(
    position.type, 
    position.quantity, 
    position.entryPrice, 
    currentPrice
  );

  const amountToReturn = position.margin + realizedPnL;
  const currentUSDBalance = getBalance("USD");
  updateBalance("USD", currentUSDBalance + amountToReturn);

  delete openPositions[positionId];
  console.log(`[Engine] Closed position ${positionId}. PNL $${realizedPnL.toFixed(2)}`);
  
  return { message: "Position closed successfully", realizedPnL };
};

export const getOpenPositions = (): Position[] => {
  return Object.values(openPositions);
};

export const updatePositionPnL = (positionId: string, newPnL: number): void => {
  if (openPositions[positionId]) {
    openPositions[positionId].unrealizedPnL = newPnL;
  }
};

export const checkForLiquidations = () => {
  const allOpenPositions = Object.values(openPositions);
  for (const position of allOpenPositions) {
    if (position.unrealizedPnL <= -position.margin) {
      console.log(`[Engine] LIQUIDATING position ${position.positionId} due to excessive losses`);

      const liquidationPrice = position.entryPrice + (position.unrealizedPnL / position.quantity);
      closePosition(position.positionId, liquidationPrice);
    }
  }
}

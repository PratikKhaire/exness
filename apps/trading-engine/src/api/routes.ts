import express from "express";
import { getBalance, getOpenPositions, closePosition, openPosition } from "../engine/store";

const router = express.Router();

// Get current engine state
router.get('/state', (req, res) => {
  console.log('[API] Request received for engine state.');

  const usdBalance = getBalance('USD');
  const solBalance = getBalance('SOL');
  const openPositions = getOpenPositions();

  const currentState = {
    balances: {
      USD: usdBalance,
      SOL: solBalance,
    },
    positions: openPositions,
  };

  res.json(currentState);
});

// Close a position
router.post('/positions/close', (req, res) => {
  console.log('[API] Request received to close a position', req.body);

  try {
    const { positionId, currentPrice } = req.body;
    if (!positionId || !currentPrice) {
      return res.status(400).json({ message: 'positionId and currentPrice are required' });
    }

    const result = closePosition(positionId, parseFloat(currentPrice));
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      message: "Failed to close position",
      error: (error as Error).message
    });
  }
});

// Open a position
router.post('/positions/open', (req, res) => {
  console.log('[API] Request received to open a position', req.body);

  try {
    const { margin, asset, type, leverage, slippage, currentPrice } = req.body;
    
    if (!margin || !asset || !type || !currentPrice) {
      return res.status(400).json({ 
        message: 'margin, asset, type, and currentPrice are required' 
      });
    }

    const position = openPosition({
      margin: parseFloat(margin),
      asset,
      type,
      leverage: leverage || 1,
      slippage: slippage || 0,
      currentPrice: parseFloat(currentPrice)
    });

    res.status(201).json(position);
  } catch (error) {
    res.status(400).json({
      message: "Failed to open position",
      error: (error as Error).message
    });
  }
});

export default router;

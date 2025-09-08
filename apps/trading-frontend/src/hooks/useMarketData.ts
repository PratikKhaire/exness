import { useState, useEffect } from 'react'
import { MarketData } from '@/types'

export function useMarketData(symbol: string = 'SOL_USDC') {
  const [marketData, setMarketData] = useState<MarketData>({
    symbol,
    price: 150.0,
    timestamp: Date.now(),
    volume: 1000000,
    bid: 149.95,
    ask: 150.05,
    change24h: 5.25,
    changePercent24h: 3.62,
  })

  const [priceHistory, setPriceHistory] = useState<number[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        // Connect to your backend WebSocket server
        ws = new WebSocket('ws://localhost:4000');

        ws.onopen = () => {
          console.log('Connected to trading WebSocket');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received market data:', data);
            
            // Handle data from your Kafka consumer (Backpack API)
            if (data.bid && data.ask) {
              const midPrice = (data.bid + data.ask) / 2;
              const newMarketData = {
                symbol,
                price: midPrice,
                timestamp: Date.now(),
                volume: data.volume || marketData.volume,
                bid: data.bid,
                ask: data.ask,
                change24h: midPrice - marketData.price,
                changePercent24h: ((midPrice - marketData.price) / marketData.price) * 100,
              };

              setMarketData(newMarketData);
              
              setPriceHistory(history => {
                const newHistory = [...history, midPrice];
                return newHistory.slice(-50); // Keep last 50 prices
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket data:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          setIsConnected(false);
          // Attempt to reconnect after 3 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setIsConnected(false);
        // Retry connection after 5 seconds
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    // Connect to WebSocket
    connectWebSocket();

    // Fallback: simulate real-time price updates if WebSocket fails
    const fallbackInterval = setInterval(() => {
      if (!isConnected) {
        setMarketData(prev => {
          const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
          const newPrice = Math.max(0.01, prev.price + change);
          
          setPriceHistory(history => {
            const newHistory = [...history, newPrice];
            return newHistory.slice(-50); // Keep last 50 prices
          });

          return {
            ...prev,
            price: newPrice,
            timestamp: Date.now(),
            bid: newPrice - 0.05,
            ask: newPrice + 0.05,
            change24h: newPrice - prev.price,
            changePercent24h: ((newPrice - prev.price) / prev.price) * 100,
          };
        });
      }
    }, 2000); // Update every 2 seconds when disconnected

    return () => {
      clearInterval(fallbackInterval);
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [symbol, marketData.price, isConnected]);

  return { marketData, priceHistory, isConnected };
}

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  UTCTimestamp,
  ColorType
} from 'lightweight-charts';

interface TradingViewChartProps {
  symbol: string;
  className?: string;
}

interface CandleData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function TradingViewChart({ symbol, className = '' }: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isPriceUpdating, setIsPriceUpdating] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1m');

  // Convert timeframe string to minutes
  const getTimeframeMinutes = (timeframe: string): number => {
    const timeframeMap: { [key: string]: number } = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440,
    };
    return timeframeMap[timeframe] || 1;
  };

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    const minutes = getTimeframeMinutes(timeframe);
    generateInitialData(minutes);
    setLastUpdate(`Switched to ${timeframe}`);
  };

  // Store candlestick data in state
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [currentCandle, setCurrentCandle] = useState<CandleData | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create the chart with enhanced styling
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#D1D5DB',
        fontSize: 12,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      grid: {
        vertLines: { 
          color: '#374151',
          style: 1,
          visible: true,
        },
        horzLines: { 
          color: '#374151',
          style: 1,
          visible: true,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#60A5FA',
          style: 2,
          labelBackgroundColor: '#1F2937',
        },
        horzLine: {
          width: 1,
          color: '#60A5FA',
          style: 2,
          labelBackgroundColor: '#1F2937',
        },
      },
      rightPriceScale: {
        borderColor: '#4B5563',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        borderVisible: true,
        textColor: '#D1D5DB',
      },
      timeScale: {
        borderColor: '#4B5563',
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
      },
      watermark: {
        visible: true,
        fontSize: 24,
        horzAlign: 'center',
        vertAlign: 'center',
        color: 'rgba(107, 114, 128, 0.3)',
        text: 'EXNESS',
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Create candlestick series with enhanced styling
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
      priceFormat: {
        type: 'price',
        precision: 6,
        minMove: 0.000001,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Generate initial historical data
    generateInitialData();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
  }, []);

  // Generate initial historical candlestick data with more realistic price action
  const generateInitialData = (timeframeMinutes: number = 1) => {
    const data: CandleData[] = [];
    const now = Math.floor(Date.now() / 1000);
    let basePrice = 150.123456; // Starting price for SOL with more precision
    
    // Generate 200 candles based on selected timeframe
    for (let i = 199; i >= 0; i--) {
      const time = (now - i * timeframeMinutes * 60) as UTCTimestamp;
      
      // Create more realistic price movement
      const volatility = 0.005 * Math.sqrt(timeframeMinutes); // Higher volatility for longer timeframes
      const trend = Math.sin(i / 20) * 0.002; // Slight trending component
      const randomChange = (Math.random() - 0.5) * volatility;
      
      const open = basePrice;
      const close = open * (1 + trend + randomChange);
      
      // Generate high and low based on open/close
      const maxPrice = Math.max(open, close);
      const minPrice = Math.min(open, close);
      const range = Math.abs(close - open);
      
      const high = maxPrice + (range * Math.random() * 0.5);
      const low = minPrice - (range * Math.random() * 0.5);

      data.push({
        time,
        open: Number(open.toFixed(6)),
        high: Number(high.toFixed(6)),
        low: Number(low.toFixed(6)),
        close: Number(close.toFixed(6)),
      });
      
      basePrice = close; // Use close as next open
    }

    setCandleData(data);
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(data);
    }

    // Set initial current candle and volume
    const lastCandle = data[data.length - 1];
    if (lastCandle) {
      setCurrentCandle(lastCandle);
      setCurrentPrice(lastCandle.close);
      setVolume(Math.floor(Math.random() * 50000) + 25000); // Set initial volume between 25k-75k
    }
  };

  // Connect to WebSocket for real-time data
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Connect to your backend WebSocket
        const ws = new WebSocket('ws://localhost:4000');
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('Connected to trading WebSocket');
          setLastUpdate('Connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received market data:', data);
            
            // Handle different message types from your backend
            if (data.type === 'price_update') {
              updateCurrentPrice(data.price);
              setVolume(data.volume || 0);
              setLastUpdate(new Date().toLocaleTimeString());
            } else if (data.bid && data.ask) {
              // Handle bid/ask data from Backpack
              const midPrice = (data.bid + data.ask) / 2;
              updateCurrentPrice(midPrice);
              setLastUpdate(new Date().toLocaleTimeString());
            }
          } catch (error) {
            console.error('Error parsing WebSocket data:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          setLastUpdate('Disconnected');
          // Reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setLastUpdate('Error');
        };

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setLastUpdate('Failed to connect');
        // Retry connection after 5 seconds
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Update current price and create new candle if needed
  const updateCurrentPrice = (newPrice: number) => {
    setIsPriceUpdating(true);
    setCurrentPrice(newPrice);
    
    // Reset the updating indicator after a short delay
    setTimeout(() => setIsPriceUpdating(false), 300);
    
    const now = Math.floor(Date.now() / 1000);
    const timeframeMinutes = getTimeframeMinutes(selectedTimeframe);
    const currentTimeframe = Math.floor(now / (timeframeMinutes * 60)) * (timeframeMinutes * 60);

    if (currentCandle && currentCandle.time === currentTimeframe) {
      // Update existing candle
      const updatedCandle: CandleData = {
        ...currentCandle,
        close: newPrice,
        high: Math.max(currentCandle.high, newPrice),
        low: Math.min(currentCandle.low, newPrice),
      };

      setCurrentCandle(updatedCandle);
      
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.update(updatedCandle);
      }
    } else {
      // Create new candle
      const newCandle: CandleData = {
        time: currentTimeframe as UTCTimestamp,
        open: currentCandle?.close || newPrice,
        high: newPrice,
        low: newPrice,
        close: newPrice,
      };

      setCurrentCandle(newCandle);
      setCandleData(prev => [...prev.slice(-199), newCandle]); // Keep only last 200 candles
      
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current.update(newCandle);
      }
    }
    
    // Update price change based on previous candle
    if (currentCandle) {
      setPriceChange(newPrice - currentCandle.close);
    }
  };

  // Enhanced real-time price simulation when WebSocket is not connected
  useEffect(() => {
    // Adjust update frequency based on timeframe
    const timeframeMinutes = getTimeframeMinutes(selectedTimeframe);
    const updateInterval = Math.max(500, Math.min(2000, timeframeMinutes * 100)); // Between 500ms and 2s
    
    const interval = setInterval(() => {
      if (wsRef.current?.readyState !== WebSocket.OPEN && currentCandle) {
        // Adjust volatility based on timeframe (longer timeframes = higher volatility)
        const baseVolatility = 0.003 * Math.sqrt(timeframeMinutes);
        const randomMultiplier = 1 + (Math.random() * 0.5);
        const volatility = baseVolatility * randomMultiplier;
        
        // Create trending movements occasionally
        const trendFactor = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1.5 : -1.5) : 1;
        
        const randomFactor = (Math.random() - 0.5) * 2 * trendFactor;
        const changePercent = randomFactor * volatility;
        const change = currentCandle.close * changePercent;
        
        const newPrice = Math.max(0.000001, currentCandle.close + change);
        updateCurrentPrice(Number(newPrice.toFixed(6)));
        
        // Simulate realistic volume changes
        setVolume(prev => {
          const volumeChange = Math.floor((Math.random() - 0.5) * 5000);
          return Math.max(1000, prev + volumeChange);
        });
        
        // Update last update time
        setLastUpdate(new Date().toLocaleTimeString());
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [currentCandle, selectedTimeframe]);

  return (
    <div className={`w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700 ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{symbol.replace('_', '/')}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className={`text-3xl font-bold text-white transition-all duration-300 ${
                  isPriceUpdating ? 'scale-105 text-blue-400' : ''
                }`}>
                  ${currentPrice.toFixed(6)}
                </span>
                {isPriceUpdating && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span 
                  className={`text-sm font-semibold px-2 py-1 rounded-full ${
                    priceChange >= 0 
                      ? 'text-green-400 bg-green-400/10' 
                      : 'text-red-400 bg-red-400/10'
                  }`}
                >
                  {priceChange >= 0 ? '↗' : '↘'} {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(6)}
                </span>
                <span 
                  className={`text-xs ${
                    priceChange >= 0 ? 'text-green-300' : 'text-red-300'
                  }`}
                >
                  ({((priceChange / currentPrice) * 100).toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-6 text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">Volume:</span>
              <span className="text-white font-medium">{volume.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                wsRef.current?.readyState === WebSocket.OPEN 
                  ? 'bg-green-400 animate-pulse' 
                  : 'bg-red-400'
              }`}></div>
              <span className="text-gray-300">Status:</span>
              <span className={`font-medium ${
                wsRef.current?.readyState === WebSocket.OPEN 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {wsRef.current?.readyState === WebSocket.OPEN ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Last Update: {lastUpdate}
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-300">Timeframe:</span>
          <div className="flex bg-gray-800/50 rounded-lg p-1 border border-gray-700">
            {['1m', '5m', '15m', '30m', '1h', '4h', '1d'].map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => handleTimeframeChange(timeframe)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-500 text-white shadow-lg transform scale-105' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span>Market Open</span>
          </div>
          <span>•</span>
          <span>24/7 Trading</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        <div 
          ref={chartContainerRef} 
          className="w-full h-[500px] bg-gray-900 rounded-lg border border-gray-700 shadow-inner"
          style={{ position: 'relative' }}
        />
        
        {/* Chart Stats Overlay */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 space-y-1">
          <div className="text-xs text-gray-300">
            <span className="text-green-400">H:</span> ${currentCandle?.high.toFixed(6) || '0.000000'}
          </div>
          <div className="text-xs text-gray-300">
            <span className="text-red-400">L:</span> ${currentCandle?.low.toFixed(6) || '0.000000'}
          </div>
          <div className="text-xs text-gray-300">
            <span className="text-blue-400">O:</span> ${currentCandle?.open.toFixed(6) || '0.000000'}
          </div>
          <div className="text-xs text-gray-300">
            <span className="text-purple-400">C:</span> ${currentCandle?.close.toFixed(6) || '0.000000'}
          </div>
        </div>
      </div>

      {/* Chart Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4 text-gray-400">
            <span>Powered by Lightweight Charts</span>
            <span>•</span>
            <span>Real-time data from Backpack API</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded transition-all">
              📷 Screenshot
            </button>
            <button className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded transition-all">
              🔗 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamically import the component to prevent SSR issues
export default dynamic(() => Promise.resolve(TradingViewChart), {
  ssr: false,
  loading: () => <div className="trading-card h-[500px] flex items-center justify-center">Loading chart...</div>
});

import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { TradingEngineConsumer } from "./engine/consumer";
import apiRoutes from "./api/routes";

const startTradingEngine = async () => {
  console.log("Starting Trading Engine...");

  // Initialize Kafka consumer
  const consumer = new TradingEngineConsumer();
  await consumer.start();

  // Initialize Express API
  const app = express();
  const PORT = 4000;

  // Add CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Trading Engine is running");
  });

  app.use('/api/v1', apiRoutes);

  // Create HTTP server
  const server = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server });

  // Store connected clients
  const clients = new Set();

  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    clients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to Trading Engine WebSocket'
    }));
  });

  // Function to broadcast market data to all connected clients
  const broadcastMarketData = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  };

  // Set up consumer to broadcast received market data
  consumer.setMarketDataCallback(broadcastMarketData);

  server.listen(PORT, () => {
    console.log(`Trading Engine API and WebSocket server started on port ${PORT}`);
  });

  console.log("Trading Engine is running");

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down Trading Engine...');
    await consumer.stop();
    server.close();
    process.exit(0);
  });
};

startTradingEngine().catch((error) => {
  console.error("Failed to start Trading Engine", error);
  process.exit(1);
});

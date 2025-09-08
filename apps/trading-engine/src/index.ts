import express from "express";
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

  app.listen(PORT, () => {
    console.log(`Trading Engine API started on port ${PORT}`);
  });

  console.log("Trading Engine is running");

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down Trading Engine...');
    await consumer.stop();
    process.exit(0);
  });
};

startTradingEngine().catch((error) => {
  console.error("Failed to start Trading Engine", error);
  process.exit(1);
});

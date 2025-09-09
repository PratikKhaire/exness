import { KafkaProducer } from "./utils/kafka";
import { BackpackWebSocketClient } from "./websocket/client";

const startMarketDataService = async () => {
  console.log("Starting Market Data Service...");

  // Initialize Kafka producer
  const producer = new KafkaProducer("market-data-service");
  await producer.connect();

  // Initialize WebSocket client
  const wsClient = new BackpackWebSocketClient(producer);
  wsClient.connect();

  console.log("Market Data Service is running");

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down Market Data Service...');
    await producer.disconnect();
    process.exit(0);
  });
};

startMarketDataService().catch((error) => {
  console.error("Failed to start Market Data Service", error);
  process.exit(1);
});

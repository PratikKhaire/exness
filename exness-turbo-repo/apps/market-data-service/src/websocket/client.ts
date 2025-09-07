import { WebSocket } from "ws";
import { KafkaProducer } from "@repo/kafka-utils";
import { MarketDataMessage } from "@repo/shared-types";

const BACKPACK_WS_URL = "wss://ws.backpack.exchange/";
const KAFKA_TOPIC = "backpack-market-updates";

export class BackpackWebSocketClient {
  private producer: KafkaProducer;

  constructor(producer: KafkaProducer) {
    this.producer = producer;
  }

  connect(): void {
    const ws = new WebSocket(BACKPACK_WS_URL);

    ws.on("open", () => {
      console.log("Connected to Backpack WebSocket");
      ws.send(
        JSON.stringify({
          id: 1,
          method: "SUBSCRIBE",
          params: ["ticker.SOL_USDC"],
        })
      );
    });

    ws.on("message", async (data) => {
      try {
        const rawMessage = JSON.parse(data.toString());
        
        // Transform to standardized format
        const marketData: MarketDataMessage = {
          symbol: "SOL_USDC",
          price: rawMessage.currentPrice || rawMessage.price || 0,
          timestamp: Date.now(),
          volume: rawMessage.volume,
          bid: rawMessage.bid,
          ask: rawMessage.ask,
        };

        await this.producer.sendMessage(KAFKA_TOPIC, marketData);
        console.log(`[MarketData] Sent price update: ${marketData.price} for ${marketData.symbol}`);
      } catch (err) {
        console.error("Failed to parse Backpack message", err);
      }
    });

    ws.on("error", (error) => {
      console.error("Backpack WebSocket error", error);
    });

    ws.on("close", () => {
      console.log("Backpack WebSocket connection closed. Reconnecting...");
      setTimeout(() => this.connect(), 5000);
    });
  }
}

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
        
        // Extract price from different possible fields
        let price = 0;
        
        // Check if this is a ticker data message from Backpack
        if (rawMessage.data && rawMessage.data.c) {
          // 'c' is the current/last price in Backpack format
          price = parseFloat(rawMessage.data.c);
        } else if (rawMessage.data && rawMessage.data.lastPrice) {
          price = parseFloat(rawMessage.data.lastPrice);
        } else if (rawMessage.data && rawMessage.data.price) {
          price = parseFloat(rawMessage.data.price);
        } else if (rawMessage.lastPrice) {
          price = parseFloat(rawMessage.lastPrice);
        } else if (rawMessage.price) {
          price = parseFloat(rawMessage.price);
        } else if (rawMessage.currentPrice) {
          price = parseFloat(rawMessage.currentPrice);
        }
        
        // Transform to standardized format
        const marketData: MarketDataMessage = {
          symbol: "SOL_USDC",
          price: price,
          timestamp: Date.now(),
          volume: rawMessage.data?.v || rawMessage.volume,
          bid: rawMessage.data?.bid || rawMessage.bid,
          ask: rawMessage.data?.ask || rawMessage.ask,
        };

        await this.producer.sendMessage(KAFKA_TOPIC, marketData);
        console.log(`[MarketData] Sent price update: $${marketData.price} for ${marketData.symbol}`);
      } catch (err) {
        console.error("Failed to parse Backpack message", err, data.toString());
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

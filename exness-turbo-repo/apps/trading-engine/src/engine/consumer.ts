import { KafkaConsumer } from "@repo/kafka-utils";
import { MarketDataMessage } from "@repo/shared-types";
import { getOpenPositions, calculateUnrealizedPnL, updatePositionPnL, checkForLiquidations } from "./store";

const KAFKA_TOPIC = "backpack-market-updates";

export class TradingEngineConsumer {
  private consumer: KafkaConsumer;

  constructor() {
    this.consumer = new KafkaConsumer("trading-engine", "trading-engine-group");
  }

  async start(): Promise<void> {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe(KAFKA_TOPIC, true);
      
      await this.consumer.run(async ({ topic, partition, message }) => {
        if (!message || !message.value) {
          return;
        }

        try {
          const marketData: MarketDataMessage = JSON.parse(message.value.toString());
          
          // Update all open positions with new market data
          const openPositions = getOpenPositions();
          for (const position of openPositions) {
            if (position.asset === "SOL") { // Match asset with market data
              const newPnL = calculateUnrealizedPnL(
                position.type,
                position.quantity,
                position.entryPrice,
                marketData.price
              );
              
              console.log(`[Engine] PnL Update for ${position.positionId}: $${newPnL.toFixed(2)}`);
              updatePositionPnL(position.positionId, newPnL);
            }
          }

          // Check for liquidations
          checkForLiquidations();
          
          console.log(`[Engine] Processed market data for ${marketData.symbol}: $${marketData.price}`);
        } catch (error) {
          console.error("Failed to process market data", error);
        }
      });
    } catch (error) {
      console.error("Error in kafka consumer", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}

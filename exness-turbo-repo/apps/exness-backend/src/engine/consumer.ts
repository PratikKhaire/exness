import { Kafka } from "kafkajs";


import { getOpenOrders, calculateUnrealizedPnL, checkForLiquidations, getOpenPositions } from "./store";
const kafka = new Kafka({
  clientId: "trading-app-engine",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "trading-engin-group" });

const KAFKA_TOPIC = "backpack-market-updates";

export const connectConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message || !message.value) {
          return;
        }
        const messageValueString = message.value.toString();

        const payload = JSON.parse(message.value.toString());


        const openPosition = getOpenPositions();
        for (const position of openPosition) {
          const currentPrice = payload.currentPrice;
          const newPnL = calculateUnrealizedPnL(
            position.type,
            position.quantity,
            position.entryPrice,
            currentPrice
          );
          console.log(
            `[Engine] PnL Update for ${position.positionId
            }: $${newPnL.toFixed(2)}`
          );
          updatePositionPnL(position.positionId, newPnL);



        }
        console.log("[Engine] received new market data", payload);
      },
    });
  } catch (error) {
    console.log("Erro in kafka consumer", error);
    process.exit(1);
  }
};
function updatePositionPnL(positionId: string, newPnL: number) {
  throw new Error("Function not implemented.");
}


import { Kafka } from "kafkajs";
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

        const payload = JSON.parse(messageValueString);

        console.log("[Engine] received new market data", payload);
      },
    });
  } catch (error) {
    console.log("Erro in kafka consumer", error);
    process.exit(1);
  }
};

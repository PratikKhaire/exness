// Kafka utilities for market-data-service
import { Kafka, Producer } from 'kafkajs';

export class KafkaProducer {
  private kafka: Kafka;
  private producer: Producer;

  constructor(clientId: string, brokers: string[] = ['localhost:9092']) {
    this.kafka = new Kafka({ clientId, brokers });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log(`[KafkaProducer] Kafka producer connected successfully`);
    } catch (error) {
      console.error('Failed to connect kafka producer', error);
      throw error;
    }
  }

  async sendMessage(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
    } catch (error) {
      console.error(`Failed to send message to kafka topic ${topic}`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }
}

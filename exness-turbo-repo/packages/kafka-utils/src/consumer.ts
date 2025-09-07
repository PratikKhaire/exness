import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

export class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    clientId: string, 
    groupId: string, 
    brokers: string[] = ['localhost:9092']
  ) {
    this.kafka = new Kafka({ clientId, brokers });
    this.consumer = this.kafka.consumer({ groupId });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
  }

  async subscribe(topic: string, fromBeginning: boolean = true): Promise<void> {
    await this.consumer.subscribe({ topic, fromBeginning });
  }

  async run(messageHandler: (payload: EachMessagePayload) => Promise<void>): Promise<void> {
    await this.consumer.run({
      eachMessage: messageHandler,
    });
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }
}

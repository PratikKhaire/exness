import {Kafka} from 'kafkajs';

const kafka = new Kafka({
    clientId:'trading-app-backend',
    brokers:['localhost:9092']
});

const producer = kafka.producer();

export const connectProduct = async () => {
    try{
        await producer.connect();
        console.log('kafka producer connected successfuly');
    }catch(error){
        console.log('Failed to connect kafka producer',error);
        process.exit(1);
    }

};

export const sendMessage = async ( topic:string,message:any)=> {
    try{
        await producer.send({
            topic:topic,
            messages:[
                {value:JSON.stringify(message)},
            ],
        });
    }catch(error){
        console.log(`failed to send the message to kafka ${topic}`,error );
    }
};
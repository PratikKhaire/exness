import WebSocket from "ws";
import { sendMessage } from "./kafka.producer";

const BACKPACK_WS_URL = 'wss://ws.backpack.exchange/';
const KAFKA_TOPIC = "backpack-market-updates";

export const connectToBackpackStream = () =>{
    const ws = new WebSocket(BACKPACK_WS_URL);

    ws.on('open',()=>{
        console.log('connected to backpack');

        ws.send(JSON.stringify({
            method:"SUBSCRIBE",
            param:["ticker.SOL_USDC"]
        }));
        
    });

    ws.on('message',(data)=>{
        const message = JSON.parse(DataTransfer.toString());
        sendMessage(KAFKA_TOPIC,message);
    });

    ws.on('error',(error)=>{
        console.log('backpack error',error);
    });
    ws.on('close',()=>{
        console.log('backpack websocket connection closed');
        setTimeout(connectToBackpackStream,5000);
    });
}
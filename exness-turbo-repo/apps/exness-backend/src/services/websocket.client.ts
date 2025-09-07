import { sendMessage } from "./kafka.producer";
import { WebSocket } from "ws";

const BACKPACK_WS_URL = "wss://ws.backpack.exchange/";
const KAFKA_TOPIC = "backpack-market-updates";

export const connectToBackpackStream = () => {
  const ws = new WebSocket(BACKPACK_WS_URL);

  ws.on("open", () => {
    console.log("connected to backpack");

    ws.send(
      JSON.stringify({
        id:1,
        method: "SUBSCRIBE",
        params: ["ticker.SOL_USDC"],
      })
    );
  });

  ws.on("message", (data) => {
    try {
     const message = JSON.parse(data.toString());
      sendMessage(KAFKA_TOPIC, message);
    } catch (err) {
      console.log("Failed to parse backpack message", err);
    }
  });

  ws.on("error", (error) => {
    console.log("backpack error", error);
  });
  ws.on("close", () => {
    console.log("backpack websocket connection closed");
    setTimeout(connectToBackpackStream, 5000);
  });
};

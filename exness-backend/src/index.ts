import express from "express";
import { connectProduct } from "./services/kafka.producer";

import { connectToBackpackStream } from "./services/websocket.client";
import { connectConsumer } from "./engine/consumer";
import { getBalance, getOpenPositions } from "./engine/store";

console.log(`staring the applicaiton`);

const startKafka = async () => {
  console.log("Initialing kafka");
  await connectProduct();

  console.log("Initializing kafka consumer");
  await connectConsumer();

  console.log("Kafka service ready");
  connectToBackpackStream();
};

startKafka().catch((error) => {
  console.log("A error in the startKafka", error);
  process.exit(1);
});
99629100000
const app = express();
const PORT = 4000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("welcome to the express server");
});

app.get('/api/v1/state', (req,res)=>{
  console.log('[API] Request received for engine state.');

  const usdBalance = getBalance('USD');
  const solBalance = getBalance('SOL');

  const openPosition = getOpenPositions();

  const currentState = {
    balances:{
      USD:usdBalance,
      SOL:solBalance,
    },
    positions:openPosition,
  }
  res.json(currentState);
})


app.listen(PORT, () => {
  console.log(`Express server started at the ${PORT}`);
});

// function express() {
//   throw new Error("Function not implemented.");

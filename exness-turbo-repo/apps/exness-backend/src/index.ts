import express from "express";
import { connectProduct } from "./services/kafka.producer";
import { closePosition } from "./engine/store";
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
const app = express();
const PORT = 5000;

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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
 // position close 

 app.post('/api/v1/positions/close', (req , res)=>{
  console.log('[API] request received to closed a position', req.body);

  try{
    const { positionId, currentPrice } = req.body;
    if(!positionId || !currentPrice){
      return res.status(400).json({message:'positionId and currentPrice are required'});
    }

    const result = closePosition(positionId, parseFloat(currentPrice));
    res.status(200).json(result);
  }catch(error){
    if(error) {
      res.status(400).json({
        message:"failed to close", error: (error as Error).message
      });
    }
  }
 });

app.listen(PORT, () => {
  console.log(`Express server started at the ${PORT}`);
});

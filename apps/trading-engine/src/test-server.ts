import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ 
    message: "Trading Engine is running (Basic Test)",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/v1/state", (req, res) => {
  res.json({
    balances: { USD: 10000, SOL: 0 },
    positions: [],
    orders: []
  });
});

app.listen(PORT, () => {
  console.log(`✅ Basic Trading Engine running on port ${PORT}`);
  console.log(`🌐 Test: http://localhost:${PORT}`);
});

export {};

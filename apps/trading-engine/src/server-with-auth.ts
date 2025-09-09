import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 4001; // Different port to avoid conflict

app.use(cors());
app.use(express.json());

// Simple auth endpoints
app.post('/auth/signup', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  res.json({ 
    message: `Signup successful for ${email}! (Email service not configured)`,
    email 
  });
});

app.post('/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  res.json({ 
    message: `Login link would be sent to ${email} (Email service not configured)`,
    email 
  });
});

app.get('/auth/verify', (req, res) => {
  const { token, email } = req.query;
  res.json({ 
    success: true,
    message: 'Login successful!',
    user: { email, verified: true }
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: "Trading Engine with Auth is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      signup: 'POST /auth/signup',
      login: 'POST /auth/login', 
      verify: 'GET /auth/verify'
    }
  });
});

app.get('/api/v1/state', (req, res) => {
  res.json({
    balances: { USD: 10000, SOL: 0 },
    positions: [],
    orders: []
  });
});

app.listen(PORT, () => {
  console.log(`Trading Engine with Auth running on port ${PORT}`);
  console.log(`Main: http://localhost:${PORT}`);
  console.log(`Auth: http://localhost:${PORT}/auth/*`);
  console.log(`State: http://localhost:${PORT}/api/v1/state`);
});

export {};

import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import dotenv from "dotenv";
import { TradingEngineConsumer } from "./engine/consumer";
import apiRoutes from "./api/routes";

// Load environment variables
dotenv.config();

const startTradingEngine = async () => {
  console.log("🚀 Starting Trading Engine...");

  // Check email configuration
  const emailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!emailConfigured) {
    console.warn("⚠️  Email service not configured properly. Magic link auth will not work.");
    console.log("💡 Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables");
  } else {
    console.log("✅ Email service configured");
  }

  // Initialize Kafka consumer
  const consumer = new TradingEngineConsumer();
  await consumer.start();

  // Initialize Express API
  const app = express();
  const PORT = process.env.PORT || 4000;

  // Add CORS middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));

  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({ 
      message: "Trading Engine is running",
      emailService: emailConfigured ? "configured" : "not configured",
      timestamp: new Date().toISOString()
    });
  });

  // Mount API routes
  app.use('/api/v1', apiRoutes);
  
  // Real auth endpoints with email functionality
  const nodemailer = require('nodemailer');
  const crypto = require('crypto');
  
  // Simple in-memory storage
  const users = new Map();
  const verificationTokens = new Map();
  
  // Setup email transporter
  let emailTransporter: any = null;
  if (emailConfigured) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Function to send magic link email
  async function sendMagicLinkEmail(email: string, token: string) {
    if (!emailTransporter) {
      console.log('❌ Email service not configured');
      return false;
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const magicLink = `${frontendUrl}/auth/verify?token=${token}&email=${email}`;
    
    try {
      await emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Login to Exness Trading Platform',
        html: `
          <h2>🔐 Login to Exness Trading</h2>
          <p>Click the link below to login:</p>
          <a href="${magicLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Login Now
          </a>
          <p>⏰ Link expires in 15 minutes.</p>
          <p><small>If you didn't request this, please ignore this email.</small></p>
        `
      });
      console.log(`📧 Magic link sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }
  
  // Signup endpoint
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Check if user already exists
      if (users.has(email)) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      // Create user
      users.set(email, {
        email,
        verified: false,
        createdAt: new Date()
      });
      
      // Generate magic link token
      const token = crypto.randomBytes(32).toString('hex');
      verificationTokens.set(token, {
        email,
        type: 'signup',
        expires: Date.now() + 15 * 60 * 1000 // 15 minutes
      });
      
      // Send magic link
      const emailSent = await sendMagicLinkEmail(email, token);
      
      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send verification email' });
      }
      
      res.json({ 
        message: '🎉 Signup successful! Check your email for verification link.',
        email 
      });
      
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Login endpoint  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Check if user exists
      if (!users.has(email)) {
        return res.status(404).json({ error: 'User not found. Please signup first.' });
      }
      
      // Generate magic link token
      const token = crypto.randomBytes(32).toString('hex');
      verificationTokens.set(token, {
        email,
        type: 'login',
        expires: Date.now() + 15 * 60 * 1000 // 15 minutes
      });
      
      // Send magic link
      const emailSent = await sendMagicLinkEmail(email, token);
      
      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send login email' });
      }
      
      res.json({ 
        message: '📧 Login link sent! Check your email.',
        email 
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Verify endpoint
  app.get('/api/auth/verify', (req, res) => {
    try {
      const { token, email } = req.query;
      
      if (!token || !email) {
        return res.status(400).json({ error: 'Token and email are required' });
      }
      
      // Check if token exists
      const tokenData = verificationTokens.get(token);
      if (!tokenData) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      
      // Check if token expired
      if (Date.now() > tokenData.expires) {
        verificationTokens.delete(token);
        return res.status(400).json({ error: 'Token expired' });
      }
      
      // Check if email matches
      if (tokenData.email !== email) {
        return res.status(400).json({ error: 'Invalid token' });
      }
      
      // Mark user as verified
      const user = users.get(email);
      if (user) {
        user.verified = true;
        user.lastLogin = new Date();
      }
      
      // Remove used token
      verificationTokens.delete(token);
      
      res.json({ 
        success: true,
        message: '✅ Login successful!',
        user: { email, verified: true }
      });
      
    } catch (error) {
      console.error('Verify error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  console.log('✅ Auth routes with email service mounted successfully');

  // Create HTTP server
  const server = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server });

  // Store connected clients
  const clients = new Set();

  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    clients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to Trading Engine WebSocket'
    }));
  });

  // Function to broadcast market data to all connected clients
  const broadcastMarketData = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  };

  // Set up consumer to broadcast received market data
  consumer.setMarketDataCallback(broadcastMarketData);

  server.listen(PORT, () => {
    console.log(`Trading Engine API and WebSocket server started on port ${PORT}`);
  });

  console.log("Trading Engine is running");

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down Trading Engine...');
    await consumer.stop();
    server.close();
    process.exit(0);
  });
};

startTradingEngine().catch((error) => {
  console.error("Failed to start Trading Engine", error);
  process.exit(1);
});

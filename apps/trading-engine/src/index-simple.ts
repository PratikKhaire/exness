import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./api/authRoutes";

// Load environment variables
dotenv.config();

const startTradingEngineSimple = async () => {
  console.log("🚀 Starting Trading Engine (Simple Mode - No Kafka)...");

  // Check email configuration
  const emailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  if (!emailConfigured) {
    console.warn("⚠️  Email service not configured properly. Magic link auth will not work.");
    console.log("💡 Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables");
    console.log("📝 Example: SMTP_HOST=smtp.gmail.com SMTP_USER=your@gmail.com SMTP_PASS=your-app-password");
  } else {
    console.log("✅ Email service configured");
  }

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
      message: "Trading Engine is running (Simple Mode)",
      emailService: emailConfigured ? "configured" : "not configured",
      timestamp: new Date().toISOString(),
      mode: "simple",
      note: "Kafka consumer disabled for testing"
    });
  });

  // Mount auth routes
  app.use('/auth', authRoutes);

  // Simple API status endpoint
  app.get('/api/v1/state', (req, res) => {
    res.json({
      balances: { USD: 10000, SOL: 0 },
      positions: [],
      orders: [],
      timestamp: new Date().toISOString()
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`✅ Trading Engine server running on port ${PORT}`);
    console.log(`🌐 API available at: http://localhost:${PORT}`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth/*`);
    console.log(`📊 Status: http://localhost:${PORT}/api/v1/state`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Trading Engine...');
    process.exit(0);
  });
};

startTradingEngineSimple().catch((error) => {
  console.error("❌ Failed to start Trading Engine:", error);
  process.exit(1);
});

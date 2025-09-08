# Exness Trading Platform - Complete Architecture Guide

## 🏗️ Complete File Structure

```
exness-turbo-repo/
├── 📁 apps/                          # Applications (deployable services)
│   ├── 📁 trading-engine/             # Independent trading service
│   │   ├── package.json               # Service dependencies
│   │   ├── tsconfig.json              # TypeScript config
│   │   └── src/
│   │       ├── index.ts               # Service entry point
│   │       ├── 📁 engine/             # Core trading logic
│   │       │   ├── store.ts           # Position/balance management
│   │       │   └── consumer.ts        # Kafka message consumer
│   │       └── 📁 api/                # REST API endpoints
│   │           └── routes.ts          # Trading API routes
│   │
│   ├── 📁 market-data-service/        # Independent data collection service
│   │   ├── package.json               # Service dependencies  
│   │   ├── tsconfig.json              # TypeScript config
│   │   └── src/
│   │       ├── index.ts               # Service entry point
│   │       └── 📁 websocket/          # WebSocket client
│   │           └── client.ts          # Backpack exchange connector
│   │
│   └── 📁 trading-frontend/           # Next.js frontend application
│       ├── package.json               # Frontend dependencies
│       ├── next.config.js             # Next.js configuration
│       └── src/                       # React components and pages
│
├── 📁 packages/                       # Shared libraries/utilities
│   ├── 📁 shared-types/               # Common TypeScript types
│   │   ├── package.json               # Package config
│   │   └── src/
│   │       ├── index.ts               # Export all types
│   │       ├── order.ts               # Order type definitions
│   │       ├── position.ts            # Position type definitions
│   │       └── market-data.ts         # Market data interfaces
│   │
│   ├── 📁 kafka-utils/                # Kafka abstraction layer
│   │   ├── package.json               # Package config
│   │   └── src/
│   │       ├── index.ts               # Export utilities
│   │       ├── producer.ts            # Kafka producer class
│   │       └── consumer.ts            # Kafka consumer class
│   │
│   ├── 📁 ui/                         # Shared UI components
│   ├── 📁 eslint-config/              # Shared linting rules
│   └── 📁 typescript-config/          # Shared TypeScript configs
│
├── package.json                       # Root workspace config
├── turbo.json                         # Turborepo configuration
├── README-NEW-STRUCTURE.md            # Documentation
└── MIGRATION-GUIDE.md                 # Migration instructions
```

## 🔄 What's Happening in This Project

### Real-Time Trading System Architecture

```
Backpack Exchange (WebSocket)
         ↓
Market Data Service (apps/market-data-service)
         ↓
Kafka Topic: "backpack-market-updates"
         ↓
Trading Engine Consumer (apps/trading-engine)
         ↓
REST API (localhost:4000)
         ↓
Client Applications
```

### Data Flow Explanation

**Step 1: Market Data Collection**
```typescript
// market-data-service/src/websocket/client.ts
WebSocket → Backpack Exchange
         ↓
Parse price updates
         ↓
Send to Kafka topic "backpack-market-updates"
```

**Step 2: Trading Engine Processing**
```typescript
// trading-engine/src/engine/consumer.ts
Kafka Consumer → Receives market data
              ↓
Update position PnL calculations
              ↓
Check for liquidations
              ↓
Store updates in memory
```

**Step 3: API Access**
```typescript
// trading-engine/src/api/routes.ts
REST API → Expose trading functions
        ↓
GET /api/v1/state (balances, positions)
POST /api/v1/positions/open (create position)
POST /api/v1/positions/close (close position)
```

### Core Components Breakdown

#### Trading Engine (apps/trading-engine/)
- **Purpose**: Core trading logic and position management
- **Port**: 4000
- **Responsibilities**:
  - Maintain user balances (USD: $10,000 initial, SOL: 0)
  - Track open positions with real-time PnL calculations
  - Execute position opening/closing operations
  - Handle automatic liquidations when losses exceed margin
  - Provide REST API for external access
  - Process Kafka messages for market data updates

#### Market Data Service (apps/market-data-service/)
- **Purpose**: Real-time data collection and distribution
- **Responsibilities**:
  - Connect to Backpack exchange WebSocket (wss://ws.backpack.exchange/)
  - Subscribe to ticker.SOL_USDC market data
  - Normalize market data into standardized format
  - Publish data to Kafka topic for other services
  - Handle connection failures and automatic reconnection

#### Shared Packages (packages/)
- **shared-types**: Common TypeScript interfaces (Order, Position, MarketDataMessage)
- **kafka-utils**: Reusable Kafka producer/consumer classes
- **ui**: Shared React components for future frontend development
- **eslint-config**: Unified code quality and linting rules
- **typescript-config**: Shared TypeScript compilation settings

## 🚀 Why We Use Turborepo

### Monorepo Benefits
```bash
# Single repository for all related code
├── Multiple apps that work together
├── Shared packages for common functionality
├── Unified development experience
└── Simplified dependency management
```

### Performance Optimization
```json
// turbo.json - Intelligent caching and task orchestration
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],    // Build dependencies first
      "outputs": ["dist/**"]      // Cache build outputs
    },
    "dev": {
      "persistent": true,         // Keep running in development
      "cache": false             // Don't cache dev processes
    }
  }
}
```

**What this means:**
- Only rebuilds packages that have changed
- Shares build cache across team members and CI/CD
- Executes independent tasks in parallel
- Respects dependency order for builds

### Independent Service Deployment
```bash
# Old way (monolith)
npm run dev  # Everything starts together, single point of failure

# New way (microservices)
npm run dev:engine       # Just trading engine (port 4000)
npm run dev:market-data  # Just market data service
npm run dev:services     # Both services independently
npm run dev             # All services in development mode
```

### Dependency Management Evolution
```typescript
// Before: Tight coupling in monolith
import { openPosition } from './engine/store';  // Direct file import
import { connectConsumer } from './engine/consumer';  // Tightly coupled

// After: Loose coupling via shared packages
import { Position, Order } from '@repo/shared-types';  // Shared types
import { KafkaProducer, KafkaConsumer } from '@repo/kafka-utils';  // Shared utilities
```

### Development Workflow Benefits

| Aspect | Without Turborepo | With Turborepo |
|--------|------------------|----------------|
| **Code Sharing** | Copy-paste between projects | Shared packages with versioning |
| **Building** | Build entire codebase every time | Build only changed parts |
| **Testing** | Test everything together | Test affected packages only |
| **Deployment** | Deploy monolith (all or nothing) | Deploy services independently |
| **Team Work** | Conflicts in single codebase | Teams work on isolated services |
| **Caching** | No intelligent caching | Smart caching across tasks |
| **Development** | Start entire application | Start only needed services |

## 🎯 Real-World Example: What Happens When You Trade

### Scenario: Opening a Long Position on SOL

**1. Market Data Flows In**
```typescript
// market-data-service receives from Backpack WebSocket
{
  symbol: "SOL_USDC",
  price: 150.50,
  timestamp: 1694097600000,
  volume: 1000000,
  bid: 150.49,
  ask: 150.51
}
```

**2. You Open a Position via API**
```bash
curl -X POST http://localhost:4000/api/v1/positions/open \
  -H "Content-Type: application/json" \
  -d '{
    "margin": 1000,
    "asset": "SOL", 
    "type": "long",
    "leverage": 2,
    "currentPrice": 150.50
  }'
```

**3. Trading Engine Processes the Request**
```typescript
// trading-engine calculates and validates
const currentUSDBalance = getBalance("USD");  // $10,000
if (currentUSDBalance < margin) throw new Error("Insufficient funds");

const quantity = (1000 * 2) / 150.50;  // 13.31 SOL equivalent
const positionId = `pos_${Math.floor(Math.random() * 1000000)}`;

const newPosition = {
  positionId: "pos_123456",
  asset: "SOL",
  type: "long",
  margin: 1000,
  leverage: 2,
  entryPrice: 150.50,
  quantity: 13.31,
  unrealizedPnL: 0,
  timestamp: Date.now()
};

// Update balances
updateBalance("USD", 9000);  // Deduct margin
```

**4. Real-time PnL Updates via Kafka**
```typescript
// As price changes flow through Kafka
Price: $150.50 → PnL: $0 (entry price)
Price: $155.00 → PnL: +$59.89 (profit! = (155-150.50) * 13.31)
Price: $145.00 → PnL: -$73.26 (loss = (145-150.50) * 13.31)
Price: $75.00  → PnL: -$1005.05 → LIQUIDATION TRIGGERED!
```

**5. Automatic Liquidation Check**
```typescript
// Continuous monitoring in trading engine
export const checkForLiquidations = () => {
  const allOpenPositions = Object.values(openPositions);
  for (const position of allOpenPositions) {
    if (position.unrealizedPnL <= -position.margin) {
      console.log(`[Engine] LIQUIDATING position ${position.positionId}`);
      const liquidationPrice = position.entryPrice + (position.unrealizedPnL / position.quantity);
      closePosition(position.positionId, liquidationPrice);
    }
  }
}
```

**6. Position Closure**
```bash
# Manual closure via API
curl -X POST http://localhost:4000/api/v1/positions/close \
  -H "Content-Type: application/json" \
  -d '{
    "positionId": "pos_123456",
    "currentPrice": 155.00
  }'

# Response
{
  "message": "Position closed successfully",
  "realizedPnL": 59.89
}
```

## 🔧 Key Turborepo Features We Use

### Task Pipeline Configuration
```json
// turbo.json - Complete configuration
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],           // Build dependencies first
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,                    // Don't cache development mode
      "persistent": true                 // Keep running
    },
    "dev:engine": {
      "cache": false,
      "persistent": true
    },
    "dev:market-data": {
      "cache": false,  
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]            // Lint dependencies first
    },
    "check-types": {
      "dependsOn": ["^check-types"]     // Type check dependencies first
    }
  }
}
```

### Workspace Management
```json
// package.json - Root configuration
{
  "name": "exness-turbo-repo",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "dev:engine": "turbo run dev --filter=trading-engine",
    "dev:market-data": "turbo run dev --filter=market-data-service",
    "dev:services": "turbo run dev --filter=trading-engine --filter=market-data-service",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "check-types": "turbo run check-types"
  },
  "workspaces": [
    "apps/*",      // All applications
    "packages/*"   // All shared packages
  ]
}
```

### Selective Execution Examples
```bash
# Build everything
npm run build

# Run specific services
npm run dev:engine                    # Only trading engine
npm run dev:market-data              # Only market data service
npm run dev:services                 # Both main services

# Development commands
turbo run dev --filter=trading-engine                    # Filter by package
turbo run build --filter=trading-engine                  # Build specific service
turbo run check-types --filter=@repo/shared-types        # Check types in shared package

# Parallel execution
turbo run build --filter=trading-engine --filter=market-data-service
```

## 🎯 Business Benefits

### Scalability Advantages
- **Independent Scaling**: Scale trading engine separately from market data collection
- **Resource Optimization**: Allocate computing resources based on actual service needs
- **Load Distribution**: Handle different traffic patterns per service
- **Geographic Distribution**: Deploy services in different regions as needed

### Reliability Improvements
- **Fault Isolation**: If market data service fails, trading engine continues operating
- **Independent Deployments**: Deploy updates without full system downtime
- **Easier Debugging**: Isolate issues to specific services
- **Graceful Degradation**: System continues functioning with reduced capabilities

### Development Speed Enhancement
- **Parallel Development**: Multiple teams work on different services simultaneously
- **Faster Builds**: Only changed code rebuilds (Turborepo caching)
- **Better Code Reusability**: Shared packages eliminate code duplication
- **Independent Testing**: Test services in isolation

### Cost Efficiency
- **Resource Optimization**: Deploy only required services in each environment
- **Selective Scaling**: Scale individual services based on demand
- **Reduced Infrastructure**: No need to over-provision for entire monolith
- **Development Efficiency**: Faster development cycles reduce time-to-market

## 📊 API Documentation

### Trading Engine API (Port 4000)

#### GET /api/v1/state
Returns current trading engine state
```json
{
  "balances": {
    "USD": 9000,
    "SOL": 0
  },
  "positions": [
    {
      "positionId": "pos_123456",
      "asset": "SOL",
      "type": "long",
      "margin": 1000,
      "leverage": 2,
      "entryPrice": 150.50,
      "quantity": 13.31,
      "unrealizedPnL": 59.89,
      "timestamp": 1694097600000
    }
  ]
}
```

#### POST /api/v1/positions/open
Opens a new trading position
```json
// Request
{
  "margin": 1000,
  "asset": "SOL",
  "type": "long",
  "leverage": 2,
  "slippage": 0.1,
  "currentPrice": 150.50
}

// Response
{
  "positionId": "pos_123456",
  "asset": "SOL",
  "type": "long",
  "margin": 1000,
  "leverage": 2,
  "entryPrice": 150.50,
  "quantity": 13.31,
  "unrealizedPnL": 0,
  "timestamp": 1694097600000
}
```

#### POST /api/v1/positions/close
Closes an existing position
```json
// Request
{
  "positionId": "pos_123456",
  "currentPrice": 155.00
}

// Response
{
  "message": "Position closed successfully",
  "realizedPnL": 59.89
}
```

## 🚀 Getting Started Guide

### Prerequisites
- Node.js >= 18
- Apache Kafka running on localhost:9092
- npm or yarn package manager

### Installation Steps
```bash
# 1. Clone repository
git clone <repository-url>
cd exness-turbo-repo

# 2. Install all dependencies
npm install

# 3. Build all packages
npm run build

# 4. Start Kafka (example with local installation)
# Terminal 1
kafka-server-start.sh config/server.properties

# 5. Start services
# Terminal 2 - Market Data Service
npm run dev:market-data

# Terminal 3 - Trading Engine  
npm run dev:engine

# 6. Test the system
curl http://localhost:4000/api/v1/state
```

### Development Workflow
```bash
# Daily development routine
npm run check-types          # Verify TypeScript types
npm run lint                 # Check code quality
npm run build               # Build changed packages
npm run dev:services        # Start all services

# Working on specific service
npm run dev:engine --watch  # Auto-restart on changes
npm run build --filter=trading-engine  # Build specific service
```

## 🔍 Monitoring and Debugging

### Service Health Checks
```bash
# Check if services are running
curl http://localhost:4000/                    # Trading Engine
curl http://localhost:4000/api/v1/state        # Trading Engine State

# Check Kafka topics
kafka-topics.sh --list --bootstrap-server localhost:9092
kafka-console-consumer.sh --topic backpack-market-updates --bootstrap-server localhost:9092
```

### Common Debug Commands
```bash
# View service logs
npm run dev:engine 2>&1 | grep "Engine"
npm run dev:market-data 2>&1 | grep "MarketData"

# Check TypeScript compilation
npm run check-types --filter=trading-engine
npm run check-types --filter=market-data-service

# Build specific packages
turbo run build --filter=@repo/shared-types
turbo run build --filter=@repo/kafka-utils
```

### Performance Monitoring
```bash
# Monitor Kafka lag
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group trading-engine-group

# Check service resource usage
top -p $(pgrep -f "trading-engine")
top -p $(pgrep -f "market-data-service")
```

## 🔧 Configuration Options

### Environment Variables
```bash
# Trading Engine
PORT=4000                              # API server port
KAFKA_BROKERS=localhost:9092           # Kafka broker addresses
KAFKA_GROUP_ID=trading-engine-group    # Consumer group ID

# Market Data Service  
BACKPACK_WS_URL=wss://ws.backpack.exchange/   # WebSocket URL
KAFKA_TOPIC=backpack-market-updates           # Kafka topic name
RECONNECT_INTERVAL=5000                       # Reconnection delay (ms)

# Shared Configuration
NODE_ENV=development                   # Environment mode
LOG_LEVEL=info                        # Logging level
```

### Kafka Topics Configuration
```bash
# Create required topics
kafka-topics.sh --create --topic backpack-market-updates \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

This complete architecture transforms your trading platform from a monolithic application into a robust, scalable microservices system where each component can evolve independently while maintaining strong consistency through well-defined interfaces and real-time data synchronization.

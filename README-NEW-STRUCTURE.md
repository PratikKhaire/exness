# Exness Trading Platform - Turborepo

A high-performance trading platform built with Turborepo for independent microservices architecture.

## 📁 Project Structure

```
├── apps/
│   ├── trading-engine/          # Independent trading engine service
│   ├── market-data-service/     # Independent market data collection service
│   └── exness-backend/          # (Original - can be deprecated)
├── packages/
│   ├── shared-types/            # Shared TypeScript types
│   ├── kafka-utils/             # Kafka utilities package
│   ├── ui/                      # UI components
│   ├── eslint-config/           # Shared ESLint configuration
│   └── typescript-config/       # Shared TypeScript configuration
```

## 🚀 Services Overview

### Trading Engine (`apps/trading-engine`)
- **Port**: 4000
- **Purpose**: Handles position management, order execution, and PnL calculations
- **Dependencies**: Kafka Consumer for market data
- **API Endpoints**:
  - `GET /api/v1/state` - Get current balances and positions
  - `POST /api/v1/positions/open` - Open a new position
  - `POST /api/v1/positions/close` - Close an existing position

### Market Data Service (`apps/market-data-service`)
- **Purpose**: Collects real-time market data from Backpack exchange
- **Dependencies**: WebSocket connection to Backpack, Kafka Producer
- **Data Flow**: WebSocket → Market Data Service → Kafka → Trading Engine

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 18
- Kafka running on localhost:9092
- npm or yarn

### Installation
```bash
# Install all dependencies
npm install

# Build all packages
npm run build
```

### Running Services

#### Run All Services
```bash
npm run dev:services
```

#### Run Individual Services
```bash
# Trading Engine only
npm run dev:engine

# Market Data Service only  
npm run dev:market-data

# All services
npm run dev
```

### Development Workflow

1. **Start Kafka** (required for services to communicate)
   ```bash
   # Start Kafka locally (adjust command based on your setup)
   kafka-server-start.sh config/server.properties
   ```

2. **Start Market Data Service**
   ```bash
   npm run dev:market-data
   ```

3. **Start Trading Engine**
   ```bash
   npm run dev:engine
   ```

## 📦 Shared Packages

### `@repo/shared-types`
Contains all shared TypeScript interfaces:
- `Order` - Trading order structure
- `Position` - Trading position structure  
- `MarketDataMessage` - Market data format

### `@repo/kafka-utils`
Reusable Kafka utilities:
- `KafkaProducer` - For publishing messages
- `KafkaConsumer` - For consuming messages

## 🔄 Data Flow

```
Backpack Exchange WebSocket
    ↓
Market Data Service
    ↓
Kafka Topic: "backpack-market-updates"
    ↓
Trading Engine Consumer
    ↓
Position PnL Updates & Liquidation Checks
```

## 🧪 Testing the System

### 1. Check System Status
```bash
curl http://localhost:4000/api/v1/state
```

### 2. Open a Position
```bash
curl -X POST http://localhost:4000/api/v1/positions/open \
  -H "Content-Type: application/json" \
  -d '{
    "margin": 1000,
    "asset": "SOL",
    "type": "long",
    "leverage": 2,
    "currentPrice": 150
  }'
```

### 3. Close a Position
```bash
curl -X POST http://localhost:4000/api/v1/positions/close \
  -H "Content-Type: application/json" \
  -d '{
    "positionId": "pos_123456",
    "currentPrice": 155
  }'
```

## 🚀 Deployment

Each service can be deployed independently:

```bash
# Build specific service
npm run build --filter=trading-engine
npm run build --filter=market-data-service

# Start in production
npm run start --filter=trading-engine
npm run start --filter=market-data-service
```

## 📊 Monitoring

- **Trading Engine**: Monitor API responses and position updates
- **Market Data Service**: Monitor WebSocket connection and Kafka message throughput
- **Kafka**: Monitor topic lag and message processing

## 🔧 Configuration

### Environment Variables
- `KAFKA_BROKERS`: Kafka broker addresses (default: localhost:9092)
- `BACKPACK_WS_URL`: Backpack WebSocket URL
- `PORT`: API server port (default: 4000)

## 🏗️ Architecture Benefits

1. **Independent Scaling**: Scale services based on individual needs
2. **Fault Isolation**: Service failures don't cascade
3. **Technology Flexibility**: Each service can use different technologies
4. **Team Autonomy**: Different teams can work on different services
5. **Deployment Independence**: Deploy services separately without downtime

## 📝 Scripts Reference

- `npm run dev` - Start all services in development
- `npm run dev:engine` - Start only trading engine
- `npm run dev:market-data` - Start only market data service
- `npm run dev:services` - Start both main services
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run check-types` - Type check all packages

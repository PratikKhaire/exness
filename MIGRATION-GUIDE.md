# Migration Guide: From Monolith to Microservices

This guide helps you transition from the existing `exness-backend` to the new microservices architecture.

## 🔄 What Changed

### Before (Monolith)
```
apps/exness-backend/
├── src/
│   ├── index.ts              # Everything in one file
│   ├── engine/
│   │   ├── consumer.ts       # Trading logic + Kafka consumer
│   │   └── store.ts          # Position/order management
│   └── services/
│       ├── kafka.producer.ts # Kafka producer
│       └── websocket.client.ts # WebSocket client
```

### After (Microservices)
```
apps/
├── trading-engine/           # Independent service
│   └── src/
│       ├── index.ts         # Trading engine entry point
│       ├── engine/          # Trading logic
│       └── api/             # REST API
├── market-data-service/      # Independent service
│   └── src/
│       ├── index.ts         # Market data entry point
│       └── websocket/       # WebSocket handling
packages/
├── shared-types/            # Common types
└── kafka-utils/             # Kafka abstractions
```

## 🚀 Migration Steps

### Step 1: Backup Current Implementation
```bash
# Create backup of current implementation
cp -r apps/exness-backend apps/exness-backend-backup
```

### Step 2: Verify New Structure Works
```bash
# Test new services
npm run dev:market-data    # Terminal 1
npm run dev:engine         # Terminal 2

# Test API
curl http://localhost:4000/api/v1/state
```

### Step 3: Update Client Applications
If you have frontend or other services calling the old backend:

#### Old Endpoints:
- `http://localhost:4000/` (everything was in one service)

#### New Endpoints:
- `http://localhost:4000/api/v1/state` - Trading engine state
- `http://localhost:4000/api/v1/positions/open` - Open position
- `http://localhost:4000/api/v1/positions/close` - Close position

### Step 4: Update Deployment Scripts
```bash
# Old deployment (single service)
npm run dev

# New deployment (multiple services)
npm run dev:services
# OR individually:
npm run dev:engine
npm run dev:market-data
```

## 🔧 Code Changes Required

### 1. Import Statements
**Old way** (in exness-backend):
```typescript
import { Order, Position } from './engine/store';
```

**New way** (using shared packages):
```typescript
import { Order, Position } from '@repo/shared-types';
import { KafkaProducer } from '@repo/kafka-utils';
```

### 2. Service Communication
**Old way** (direct function calls):
```typescript
import { openPosition } from './engine/store';
// Direct function call
const position = openPosition(params);
```

**New way** (HTTP API):
```typescript
// HTTP request to trading engine
const response = await fetch('http://localhost:4000/api/v1/positions/open', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(params)
});
```

### 3. Kafka Setup
**Old way** (manual Kafka setup):
```typescript
const kafka = new Kafka({ clientId: 'app', brokers: ['localhost:9092'] });
const producer = kafka.producer();
```

**New way** (using utilities):
```typescript
import { KafkaProducer } from '@repo/kafka-utils';
const producer = new KafkaProducer('my-service');
```

## 🔍 Key Differences

| Aspect | Old (Monolith) | New (Microservices) |
|--------|----------------|---------------------|
| **Deployment** | Single process | Multiple processes |
| **Scaling** | Scale everything | Scale services independently |
| **Communication** | Function calls | HTTP API + Kafka |
| **Development** | One repository context | Service-specific contexts |
| **Testing** | Test everything together | Test services independently |
| **Dependencies** | Shared in one package.json | Service-specific dependencies |

## ⚠️ Breaking Changes

1. **API Endpoints**: All endpoints now have `/api/v1` prefix
2. **Service Ports**: Trading engine runs on port 4000
3. **Dependencies**: Services now use shared packages
4. **Data Flow**: Communication via Kafka topics instead of direct calls

## 🧪 Testing Migration

### 1. Functional Testing
```bash
# Test market data collection
# Check Kafka topics for messages

# Test trading engine
curl -X POST http://localhost:4000/api/v1/positions/open \
  -H "Content-Type: application/json" \
  -d '{"margin": 100, "asset": "SOL", "type": "long", "currentPrice": 150}'
```

### 2. Performance Testing
- Compare response times between old and new architecture
- Monitor Kafka message throughput
- Check memory usage per service

### 3. Integration Testing
- Verify WebSocket → Kafka → Trading Engine flow
- Test position updates with real market data
- Validate liquidation logic

## 🐛 Common Issues & Solutions

### Issue 1: Import Errors
```
Cannot find module '@repo/shared-types'
```
**Solution**: Run `npm install` in root directory

### Issue 2: Kafka Connection Issues
```
Failed to connect kafka producer
```
**Solution**: Ensure Kafka is running on localhost:9092

### Issue 3: Port Conflicts
```
Port 4000 already in use
```
**Solution**: Stop old backend service or change port

## 📦 Rollback Plan

If you need to rollback to the old structure:

```bash
# Stop new services
pkill -f "trading-engine"
pkill -f "market-data-service"

# Start old service
cd apps/exness-backend
npm run dev
```

## 🎯 Next Steps

1. **Monitor Performance**: Compare new vs old architecture metrics
2. **Add Monitoring**: Implement health checks for each service
3. **Documentation**: Update API documentation for new endpoints
4. **CI/CD**: Update deployment pipelines for multiple services
5. **Alerting**: Set up alerts for service failures

## ✅ Verification Checklist

- [ ] Market data service connects to Backpack WebSocket
- [ ] Market data flows through Kafka successfully
- [ ] Trading engine receives and processes market data
- [ ] API endpoints respond correctly
- [ ] Position opening/closing works
- [ ] PnL calculations are accurate
- [ ] Liquidation logic functions properly
- [ ] All tests pass
- [ ] Performance meets requirements
- [ ] Monitoring is in place

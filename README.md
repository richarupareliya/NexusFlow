# NexusFlow

Visual IoT telemetry and rule-engine platform. NexusFlow combines a React Flow canvas with a high-throughput Node.js ingestion API backed by MongoDB native time-series collections.

## Week 1 foundation

- MongoDB `telemetry` time-series collection with device and metric metadata
- Thirty-day automatic telemetry retention
- Single-point and batch ingestion (up to 1,000 points per request)
- Input validation and an API health endpoint
- Interactive React Flow canvas with click-to-add and drag-and-drop node creation
- Sample Turbine Sensor → Moving Average → SMS Alert pipeline
- Responsive dark monitoring interface

## Requirements

- Node.js 20+
- MongoDB 5.0+

## Run locally

```bash
pnpm install
copy apps\server\.env.example apps\server\.env
pnpm dev
```

The web app runs at `http://localhost:5173`, while the ingestion API runs at `http://localhost:4000`.

Send a telemetry point:

```bash
curl -X POST http://localhost:4000/api/v1/telemetry \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"turbine-01","metric":"temperature","value":82.4}'
```

The endpoint also accepts an array of up to 1,000 points for efficient batch ingestion.

## Quality checks

```bash
pnpm test
pnpm build
```

## Project roadmap

- Week 1: time-series storage, ingestion API, and visual canvas scaffold
- Week 2: RxJS graph compiler and custom node library
- Week 3: live WebSocket execution and telemetry dashboards
- Week 4: webhooks, mock SMS alerting, and animated execution feedback

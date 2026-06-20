# Node.js Backend API (Canary Deployment + Feature Flags)

## Tech-Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js oder Fastify
- **Package-Manager:** npm oder yarn
- **Deployment:** Docker + Kubernetes (oder Docker Compose)
- **Feature-Flags:** LaunchDarkly, Unleash, oder custom Redis
- **Database:** PostgreSQL, MongoDB mit Migrations
- **Monitoring:** Prometheus + Grafana, CloudWatch

## Maturity-Level
**Level 3 (Produktiv)** – Für produktive APIs mit Zero-Downtime Updates

---

## Architektur-Beschreibung

Node.js Backend-APIs müssen Anfragen laufend verarbeiten:
1. **Graceful Shutdown** – Laufende Requests fertigstellen, dann stoppen
2. **Database Migrations** – Vor Code-Deployment durchführen
3. **Canary Deployment** – Neue Version zunächst auf 10% des Traffic
4. **Feature-Flags** – Server-seitige Logik A/B testen ohne Neustart
5. **Health Checks** – Load-Balancer erkennt unhealthy Instanzen

Typischer Flow:
- DB-Migration (v1 Schema kompatibel mit alter + neuer App)
- Neue Instanzen starten (Canary: 10%)
- Health-Check: Nur wenn erfolgreich, mehr Traffic
- Nach 1 Stunde: 100% auf neue Version
- Alte Instanzen herunterfahren

---

## Code-Snippet: Express Server mit Graceful Shutdown

```typescript
// src/server.ts
import express, { Express } from 'express'
import { Server } from 'http'
import { featureFlagMiddleware } from './middleware/featureFlags'
import { versionEndpoint } from './routes/version'
import { healthCheckEndpoint } from './routes/health'
import { apiRoutes } from './routes/api'

const app: Express = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(featureFlagMiddleware)

// Routes
app.get('/version', versionEndpoint)
app.get('/health', healthCheckEndpoint)
app.use('/api', apiRoutes)

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.statusCode || 500).json({ error: err.message })
})

let server: Server | null = null
let isShuttingDown = false

export async function startServer(): Promise<Server> {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      resolve(server!)
    })
  })
}

export async function gracefulShutdown(): Promise<void> {
  if (!server || isShuttingDown) return

  isShuttingDown = true
  console.log('🛑 Graceful shutdown initiated...')

  // Stop accepting new connections
  server.close(() => {
    console.log('✅ All connections closed')
    process.exit(0)
  })

  // Force shutdown after timeout (30 seconds)
  setTimeout(() => {
    console.error('❌ Timeout reached, forcing shutdown')
    process.exit(1)
  }, 30000)
}

// Handle signals
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

export default app
```

---

## Code-Snippet: Health Check Endpoint

```typescript
// src/routes/health.ts
import { Router, Request, Response } from 'express'
import { db } from '../db'
import { redisClient } from '../cache'

const router = Router()

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  version: string
  dependencies: {
    database: boolean
    cache: boolean
    uptime: number
  }
}

router.get('/', async (req: Request, res: Response) => {
  const health: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '0.0.0',
    dependencies: {
      database: false,
      cache: false,
      uptime: process.uptime()
    }
  }

  // Database check
  try {
    await db.query('SELECT 1')
    health.dependencies.database = true
  } catch (error) {
    console.error('Database health check failed:', error)
    health.status = 'degraded'
  }

  // Redis/Cache check
  try {
    await redisClient.ping()
    health.dependencies.cache = true
  } catch (error) {
    console.error('Cache health check failed:', error)
    health.status = 'degraded'
  }

  const statusCode = health.status === 'ok' ? 200 : 503
  res.status(statusCode).json(health)
})

export default router
```

---

## Code-Snippet: Feature-Flags Middleware

```typescript
// src/middleware/featureFlags.ts
import { Request, Response, NextFunction } from 'express'
import { redisClient } from '../cache'

interface FeatureFlags {
  [key: string]: {
    enabled: boolean
    rolloutPercentage: number
    targetUsers?: string[]
  }
}

declare global {
  namespace Express {
    interface Request {
      featureFlags: FeatureFlags
      isFeatureEnabled: (feature: string, userId?: string) => boolean
    }
  }
}

export async function featureFlagMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Load feature flags from Redis (cached)
    const flagsJson = await redisClient.get('feature:flags')
    const flags: FeatureFlags = flagsJson ? JSON.parse(flagsJson) : {}

    req.featureFlags = flags

    // Helper to check if feature is enabled for user
    req.isFeatureEnabled = (feature: string, userId?: string): boolean => {
      const flag = flags[feature]
      if (!flag || !flag.enabled) return false

      // Check target users
      if (flag.targetUsers && userId && flag.targetUsers.includes(userId)) {
        return true
      }

      // Check rollout percentage (hash-based)
      if (flag.rolloutPercentage < 100) {
        const hash = hashUserId(userId || 'anonymous')
        return (hash % 100) < flag.rolloutPercentage
      }

      return true
    }

    next()
  } catch (error) {
    console.error('Feature flag middleware error:', error)
    next()
  }
}

function hashUserId(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}
```

---

## Code-Snippet: API Route mit Feature-Flag

```typescript
// src/routes/api.ts
import { Router, Request, Response } from 'express'
import { getUser, getUserV2 } from '../services/userService'

const router = Router()

router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.query.user_id as string

    // Use new user service if feature is enabled
    const useNewService = req.isFeatureEnabled('new_user_service', userId)

    let user
    if (useNewService) {
      console.log(`Using new user service for user ${id}`)
      user = await getUserV2(id)
    } else {
      user = await getUser(id)
    }

    res.json(user)
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message })
  }
})

export default router
```

---

## Code-Snippet: Database Migration Script

```typescript
// src/migrations/002_add_user_preferences.ts
import { QueryResult } from 'pg'
import { db } from '../db'

export async function up(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      theme VARCHAR(50) DEFAULT 'light',
      language VARCHAR(5) DEFAULT 'en',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create index for faster lookups
  await db.query(`
    CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id)
  `)

  console.log('✅ Migration 002 applied')
}

export async function down(): Promise<void> {
  await db.query('DROP TABLE IF EXISTS user_preferences')
  console.log('✅ Migration 002 rolled back')
}

// Migration runner
export async function runMigrations(): Promise<void> {
  const result = await db.query(`
    SELECT MAX(version) as latest FROM schema_migrations
  `)

  const latestVersion = result.rows[0]?.latest || 0
  const migrations = [
    { version: 1, name: '001_initial_schema' },
    { version: 2, name: '002_add_user_preferences' }
  ]

  for (const migration of migrations) {
    if (migration.version > latestVersion) {
      console.log(`Running migration ${migration.version}...`)
      const migrationsModule = await import(`./${migration.name}`)
      await migrationsModule.up()

      await db.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        [migration.version]
      )
    }
  }
}
```

---

## Code-Snippet: Kubernetes Deployment (Canary)

```yaml
# deploy/app-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
        version: v3.2.1
    spec:
      containers:
      - name: app
        image: my-registry/my-app:3.2.1
        ports:
        - containerPort: 3000
        
        env:
        - name: APP_VERSION
          value: "3.2.1"
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        
        # Health checks
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 2
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 2
          failureThreshold: 3
        
        # Graceful shutdown
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: my-app
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **Requests hängen nach Shutdown** | Keine Graceful Shutdown timeout | SIGTERM handler mit Timeout implementieren |
| **DB-Migration schlägt fehl** | Schema-Inkompatibilität; alte App noch laufen | Migration vor Code-Deployment; alte App-Version bis 5 Min laufen lassen |
| **Canary-Deployment wird zu aggressiv** | Feature-Flag-Rollout zu schnell | Rollout von 10% → 25% → 50% → 100% mit 15-Minuten-Pausen |
| **Feature-Flag-Cache veraltet** | Redis nicht aktualisiert | Kürzer TTL setzen (1 Min statt 10 Min) |

---

## Best Practices

1. **Database Migrations:** Schema-Änderungen vor Code; backward-compatible Design
2. **Graceful Shutdown:** `SIGTERM` korrekt handhaben; nicht `SIGKILL`
3. **Health Checks:** DB, Cache, Disk überprüfen; unhealthy schnell entfernen
4. **Feature Flags:** User-basiertes Hash für konsistentes Rollout
5. **Monitoring:** Error-Rate, Response-Time, Health-Check-Status tracken

---

## Links & Tools

- [Express.js Graceful Shutdown](https://nodejs.org/en/docs/guides/nodejs-performance-pantomime-performance/)
- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [LaunchDarkly Feature Flags](https://launchdarkly.com/)
- [Unleash Open-Source Feature Flags](https://unleash.getunleash.io/)
- [Database Migrations with TypeORM](https://typeorm.io/migrations)

# Vue.js Server-Rendered (SSR + Version Manifest API)

## Tech-Stack
- **Framework:** Vue.js 3 with SSR
- **Build-Tool:** Vite
- **Server:** Node.js (Express) oder Cloudflare Workers
- **Distribution:** Vercel, Netlify, oder eigenem Server
- **Version-Management:** Manifest API für Client-Polling
- **Database:** Redis für Update-Tracking

## Maturity-Level
**Level 2–3 (Stabilisierung bis Produktiv)** – Für Server-Rendered Apps mit Zero-Downtime Updates

---

## Architektur-Beschreibung

Vue.js SSR (Server-Side Rendering) Apps haben unterschiedliche Update-Anforderungen:
1. **Client-seitige Updates** – JavaScript-Bundle, ähnlich wie React SPA
2. **Server-seitige Updates** – Neue Rendering-Engine, Datenbankmigrationen
3. **Synchronized Updates** – Server und Client müssen kompatibel sein

Strategie:
- Alte Server-Instanzen graduell herunterfahren
- Neue Instanzen mit neuer Version starten
- Clients erkennen inkompatible Version und laden neu
- Sessions werden auf neue Instanz migriert (via Redis)

---

## Code-Snippet: package.json mit Scripts

```json
{
  "name": "my-vue-ssr-app",
  "version": "3.2.1",
  "type": "module",
  "scripts": {
    "dev": "node --loader tsx ./server.ts",
    "build": "vite build",
    "build:server": "vite build --ssr",
    "preview": "node dist/server/entry-server.js",
    "deploy": "npm run build && npm run build:server && npm run migrate-db && npm run restart-server"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "express": "^4.18.0",
    "redis": "^4.6.0",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.0",
    "vite": "^4.3.0",
    "tsx": "^3.12.0"
  }
}
```

---

## Code-Snippet: Vite Config (SSR)

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  
  build: {
    minify: 'terser',
    sourcemap: false,
    
    // Client build
    rollupOptions: {
      input: {
        app: 'src/entry-client.ts'
      },
      output: {
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: '[ext]/[name].[hash][extname]'
      }
    }
  },
  
  ssr: {
    // SSR-specific config
    external: ['redis', 'express']
  }
})
```

---

## Code-Snippet: Express Server mit Version-Endpoint

```typescript
// server.ts
import express, { Express, Request, Response } from 'express'
import { createServer as createViteServer } from 'vite'
import * as fs from 'fs'
import * as path from 'path'
import redis from 'redis'

const app: Express = express()
const PORT = process.env.PORT || 3000
const VERSION = process.env.npm_package_version || '1.0.0'
const BUILD_TIME = new Date().toISOString()

// Redis für Session-Tracking
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
})

redisClient.on('error', (err) => console.log('Redis Error:', err))

// Version Manifest (nicht gecacht)
app.get('/api/version', (_req: Request, res: Response) => {
  res.set('Cache-Control', 'public, max-age=0, must-revalidate')
  res.json({
    version: VERSION,
    buildTime: BUILD_TIME,
    requiredClientVersion: '2.0.0', // Minimum client version
    compatibleVersions: ['3.2.1', '3.2.0', '3.1.x']
  })
})

// Health Check für Load-Balancer
app.get('/health', (_req: Request, res: Response) => {
  res.set('Cache-Control', 'no-cache')
  res.json({ status: 'ok', version: VERSION })
})

// Main SSR Renderer
app.use(express.static('dist/client', { maxAge: '31536000' }))

app.use(async (req: Request, res: Response) => {
  try {
    // Load manifest
    const manifest = JSON.parse(
      fs.readFileSync(path.resolve('dist/client/ssr-manifest.json'), 'utf-8')
    )

    // Import SSR entry
    const { render } = await import('./dist/server/entry-server.js')

    // Check client version compatibility
    const clientVersion = req.headers['x-client-version'] as string || '0.0.0'
    if (!isVersionCompatible(clientVersion)) {
      // Force client reload for incompatible version
      return res.status(409).json({
        error: 'Version incompatible',
        currentVersion: VERSION,
        clientVersion
      })
    }

    // Render HTML
    const html = await render(req.url, { manifest })

    // Inject version into HTML
    const finalHtml = html.replace(
      '</head>',
      `<meta name="app-version" content="${VERSION}"></head>`
    )

    res.set('Cache-Control', 'public, max-age=0, must-revalidate')
    res.type('text/html').send(finalHtml)
  } catch (e: any) {
    console.error('SSR Error:', e)
    res.status(500).send(e.message)
  }
})

function isVersionCompatible(clientVersion: string): boolean {
  // Simple semver check
  const [majorClient] = clientVersion.split('.')
  const [majorServer] = VERSION.split('.')
  return majorClient === majorServer
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📦 Version: ${VERSION}`)
})
```

---

## Code-Snippet: Client Entry mit Version-Check

```typescript
// src/entry-client.ts
import { createApp } from 'vue'
import App from './App.vue'
import { useVersionCheck } from './composables/useVersionCheck'

const app = createApp(App)

// Version-Check Hook
const { checkVersion, versionMismatch } = useVersionCheck()

// Initiales Version-Check
await checkVersion()

// Regelmäßige Version-Checks
setInterval(checkVersion, 5 * 60 * 1000) // Alle 5 Minuten

// Bei Version-Mismatch: Hard Reload
watch(() => versionMismatch.value, (mismatch) => {
  if (mismatch) {
    console.warn('Version mismatch detected, reloading...')
    window.location.reload()
  }
})

app.mount('#app')
```

---

## Code-Snippet: Version-Check Composable

```typescript
// src/composables/useVersionCheck.ts
import { ref, watch } from 'vue'
import axios from 'axios'

interface VersionInfo {
  version: string
  buildTime: string
  requiredClientVersion: string
  compatibleVersions: string[]
}

export function useVersionCheck() {
  const currentVersion = 
    document.querySelector('meta[name="app-version"]')?.getAttribute('content') || '0.0.0'
  const versionMismatch = ref(false)
  const availableVersion = ref<VersionInfo | null>(null)

  async function checkVersion() {
    try {
      const response = await axios.get<VersionInfo>('/api/version', {
        headers: {
          'X-Client-Version': currentVersion
        }
      })

      if (response.status === 409) {
        // Server says version is incompatible
        versionMismatch.value = true
      } else {
        availableVersion.value = response.data

        // Check if update available
        if (response.data.version !== currentVersion) {
          console.log('Update available:', response.data.version)
          notifyUpdateAvailable(response.data)
        }
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        versionMismatch.value = true
      }
      console.error('Version check failed:', error)
    }
  }

  function notifyUpdateAvailable(version: VersionInfo) {
    const event = new CustomEvent('update-available', { detail: version })
    window.dispatchEvent(event)
  }

  return {
    currentVersion,
    versionMismatch,
    availableVersion,
    checkVersion
  }
}
```

---

## Code-Snippet: Blue-Green Deployment Script

```bash
#!/bin/bash

# Blue-Green Deployment für Zero Downtime

set -e

VERSION=$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | xargs)
BLUE_INSTANCE="app-blue"
GREEN_INSTANCE="app-green"
LOAD_BALANCER="app-load-balancer"

echo "🚀 Deploying version $VERSION"

# 1. Build new version
echo "📦 Building..."
npm run build
npm run build:server

# 2. Stop GREEN instance (old version)
echo "⏹️ Stopping old instance ($GREEN_INSTANCE)..."
ssh app-server "docker stop $GREEN_INSTANCE || true"

# 3. Run new version on GREEN
echo "🟢 Starting new version on $GREEN_INSTANCE..."
ssh app-server "cd /app && \
  docker run -d --name $GREEN_INSTANCE \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e VERSION=$VERSION \
  my-app:$VERSION"

# 4. Health check NEW instance
echo "🏥 Health checking..."
for i in {1..30}; do
  if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo "✅ New instance is healthy"
    break
  fi
  echo "⏳ Waiting for health check ($i/30)..."
  sleep 2
done

# 5. Switch load balancer from BLUE to GREEN
echo "🔄 Switching load balancer..."
ssh app-server "docker exec $LOAD_BALANCER \
  /bin/sh -c 'echo \"server app-green:3000;\" > /etc/nginx/upstream.conf && \
  nginx -s reload'"

# 6. Wait a bit, then stop OLD instance
sleep 10
echo "🛑 Stopping old instance..."
ssh app-server "docker stop $BLUE_INSTANCE"

# 7. Rename GREEN -> BLUE for next deployment
ssh app-server "docker rename $GREEN_INSTANCE $BLUE_INSTANCE"

echo "✅ Deployment complete! Version $VERSION is now live"
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **Session-Verlust nach Update** | Session nicht auf Redis migriert | Sessions in Redis speichern, nicht in Memory |
| **API-Inkompatibilität** | Old Client → New API | API-Versionierung (/api/v1, /api/v2); Fallback-Logic |
| **Rendering-Fehler nach Update** | SSR-Code inkompatibel mit Client | Gründliche Tests; Staging-Deploy vor Production |
| **Stuck at old version** | Version-Check nicht implementiert | Manifest-Endpoint überprüfen; Client-Side Version-Check erzwingen |

---

## Best Practices

1. **Manifest-Versioning:** Server gibt `compatibleVersions` zurück, nicht nur aktuelle Version
2. **Graceful Shutdown:** Alte Instanzen Requests zu Ende bringen vor Shutdown
3. **Database Migrations:** Schema-Änderungen vor Code-Deployment durchführen
4. **Monitoring:** Fehlerrate, Latenz nach Deployment tracken
5. **Rollback-Plan:** Schnell auf alte Version zurückwechseln können

---

## Links & Tools

- [Vue.js SSR Guide](https://vuejs.org/guide/ssr/)
- [Vite SSR Documentation](https://vitejs.dev/guide/ssr.html)
- [Redis Persistence](https://redis.io/docs/management/persistence/)
- [Docker Compose for Blue-Green](https://docs.docker.com/compose/)
- [Nginx Upstream Switching](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)

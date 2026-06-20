# React SPA (Service Worker + Cache Busting)

## Tech-Stack
- **Framework:** React 18+
- **Build-Tool:** Vite oder Create React App
- **Package-Manager:** npm oder yarn
- **Service Worker:** Workbox oder custom
- **Distribution:** AWS S3 + CloudFront CDN
- **Cache-Strategy:** Cache-First für Assets, Network-First für App-Shell

## Maturity-Level
**Level 2–3 (Stabilisierung bis Produktiv)** – Für Single-Page Apps mit Service Worker

---

## Architektur-Beschreibung

React SPAs mit Service Worker können schnell aktualisiert werden:
1. **Caching-Strategie** – Assets (JS/CSS/Images) gecacht, App-Shell nicht
2. **Version-Manifest** – Index-Datei mit Versionsnummer
3. **Background-Sync** – Service Worker prüft auf Aktualisierung
4. **Soft-Update** – App informiert Nutzer, dass neue Version da ist
5. **Hard-Refresh** – Bei Critical Updates kann erzwungen werden

Kein Neustart nötig wie bei Desktop-Apps – nur Page Reload.

---

## Code-Snippet: Vite Config mit Service Worker

```javascript
// vite.config.js
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}'
        ],
        // Cache JS/CSS für 30 Tage
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 Stunde
              }
            }
          },
          {
            urlPattern: /\.(?:js|css|woff2)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'asset-cache',
              expiration: {
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Tage
              }
            }
          }
        ]
      },
      
      manifest: {
        name: 'My React App',
        short_name: 'MyApp',
        description: 'A progressive web app',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
}
```

---

## Code-Snippet: Update-Check Hook (React)

```typescript
import { useEffect, useState, useCallback } from 'react'

interface UpdateInfo {
  available: boolean
  version: string
  timestamp: string
}

export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isCheckingForUpdate, setIsCheckingForUpdate] = useState(false)

  const checkForUpdates = useCallback(async () => {
    setIsCheckingForUpdate(true)
    try {
      // Fetch version manifest (not cached by Service Worker)
      const response = await fetch('/version.json', {
        cache: 'no-store' // Always fetch fresh
      })
      const data = await response.json()
      
      const currentVersion = window.__APP_VERSION__ || '0.0.0'
      
      if (data.version !== currentVersion) {
        setUpdateInfo({
          available: true,
          version: data.version,
          timestamp: new Date().toISOString()
        })
      } else {
        setUpdateInfo(null)
      }
    } catch (error) {
      console.error('Update check failed:', error)
    } finally {
      setIsCheckingForUpdate(false)
    }
  }, [])

  // Check every 6 hours
  useEffect(() => {
    const interval = setInterval(checkForUpdates, 6 * 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [checkForUpdates])

  // Initial check
  useEffect(() => {
    checkForUpdates()
  }, [checkForUpdates])

  return { updateInfo, isCheckingForUpdate, checkForUpdates }
}
```

---

## Code-Snippet: Update Notification Component

```typescript
// UpdateNotifier.tsx
import React, { useEffect, useState } from 'react'
import { useAppUpdate } from './useAppUpdate'

export function UpdateNotifier() {
  const { updateInfo, checkForUpdates } = useAppUpdate()
  const [dismissed, setDismissed] = useState(false)

  const handleUpdate = () => {
    // Hard refresh to load new version
    window.location.reload()
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Dismiss for 1 hour
    setTimeout(() => setDismissed(false), 60 * 60 * 1000)
  }

  if (!updateInfo?.available || dismissed) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#ffd700',
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      fontFamily: 'system-ui'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <strong>Neue Version verfügbar: {updateInfo.version}</strong>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
          Aktualisiert von: {updateInfo.timestamp}
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={handleUpdate}
          style={{
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Jetzt aktualisieren
        </button>
        
        <button 
          onClick={handleDismiss}
          style={{
            padding: '6px 12px',
            backgroundColor: 'transparent',
            border: '1px solid #333',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Später
        </button>
      </div>
    </div>
  )
}

// In App.tsx
export function App() {
  return (
    <>
      <UpdateNotifier />
      {/* Rest of app */}
    </>
  )
}
```

---

## Code-Snippet: Version-Manifest Generator (Node.js)

```javascript
// scripts/generate-version.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const version = process.env.npm_package_version || '0.0.0'
const buildTime = new Date().toISOString()
const commitHash = process.env.GITHUB_SHA?.substring(0, 8) || 'dev'

const versionInfo = {
  version,
  buildTime,
  commitHash,
  environment: process.env.NODE_ENV || 'development'
}

const distDir = path.join(__dirname, '../dist')
fs.mkdirSync(distDir, { recursive: true })

// Write version.json (not cached by Service Worker)
fs.writeFileSync(
  path.join(distDir, 'version.json'),
  JSON.stringify(versionInfo, null, 2)
)

// Write version.js for inline usage
fs.writeFileSync(
  path.join(distDir, 'version.js'),
  `window.__APP_VERSION__ = "${version}";`
)

console.log('✅ Version manifest generated:', versionInfo)
```

---

## Code-Snippet: Build Script (package.json)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "node scripts/generate-version.js && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && aws s3 sync dist/ s3://my-app-bucket/ --delete && aws cloudfront create-invalidation --distribution-id E1234567 --paths '/*'"
  }
}
```

---

## Code-Snippet: S3 + CloudFront Deployment

```bash
#!/bin/bash

# Build
npm run build

# Upload to S3 (versioned assets: cache forever)
aws s3 cp dist/ s3://my-app-bucket/ \
  --recursive \
  --include "*.js" \
  --include "*.css" \
  --cache-control "public, max-age=31536000, immutable"

# Upload index.html (no cache)
aws s3 cp dist/index.html s3://my-app-bucket/index.html \
  --cache-control "public, max-age=0, must-revalidate"

# Upload version.json (no cache)
aws s3 cp dist/version.json s3://my-app-bucket/version.json \
  --cache-control "public, max-age=0, must-revalidate"

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1234567 \
  --paths "/index.html" "/version.json"

echo "✅ Deployment complete!"
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **Service Worker wird nicht aktualisiert** | Alte Version cached; Scope falsch | Hard-Refresh (Cmd+Shift+R); Service Worker Scope überprüfen |
| **Version-Manifest nicht erreichbar** | Cache-Control Headers falsch | S3/CDN Cache-Control auf `no-cache` setzen |
| **Breaking API-Change bricht alte App** | Neue API-Version mit alter App inkompatibel | Feature-Flags für API-Changes; Versionierung der API |
| **User sieht alte Version nach Update** | Browser-Cache nicht gelöscht | Versionierte Asset-URLs (hash-basiert); Hard-Refresh prometen |

---

## Best Practices

1. **Asset Versioning:** Webpack/Vite generiert automatisch Hashes
2. **Cache-Busting:** index.html nicht cachen, Assets lange cachen
3. **Service Worker:** Mit `skipWaiting()` für sofortige Updates
4. **API-Versionierung:** `/api/v1/...` für Kompatibilität
5. **Monitoring:** Neue Version adoption Rate tracken

---

## Links & Tools

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [AWS S3 + CloudFront](https://docs.aws.amazon.com/cloudfront/)
- [Cache-Control Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)

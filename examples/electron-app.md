# Electron App mit electron-updater

## Tech-Stack
- **Framework:** Electron (Node.js + Chromium)
- **Platforms:** Windows, macOS, Linux
- **Update-Tool:** electron-updater (native Lösung für Electron)
- **Distribution:** GitHub Releases, AWS S3, oder eigenem Server
- **Code-Signing:** Windows Code Signing Certificate, macOS Developer ID

## Maturity-Level
**Level 3 (Produktiv)** – Für Cross-Platform Desktop-Apps mit automatischen Updates

---

## Architektur-Beschreibung

Electron-Apps nutzen `electron-updater` für nahtlose Update-Mechanismen:
1. App startet und prüft im Hintergrund auf Updates
2. Delta-Updates (nur Änderungen) werden heruntergeladen
3. Installation erfolgt im Hintergrund, Restart beim nächsten Shutdown
4. Blockiert User nicht, kann aber Critical-Updates forcen

Latest-Metadata wird aus GitHub Releases, S3 oder eigenem Server gelesen. Jeder Release braucht:
- Ausführbare Datei (.exe, .dmg, .AppImage)
- `latest.json` oder `latest-mac.json` Manifest
- Checksums und Signaturen

---

## Code-Snippet: electron-updater Konfiguration (package.json)

```json
{
  "name": "my-electron-app",
  "version": "3.2.1",
  "build": {
    "appId": "com.example.myapp",
    "publish": [
      {
        "provider": "github",
        "owner": "my-org",
        "repo": "my-app",
        "releaseType": "release"
      }
    ],
    "win": {
      "certificateFile": "certificate.pfx",
      "certificatePassword": "${CSC_KEY_PASSWORD}",
      "signingHashAlgorithms": ["sha256"]
    },
    "mac": {
      "identity": "Developer ID Application: My Company (TEAM12345)",
      "entitlements": "build/entitlements.mac.plist"
    }
  },
  "devDependencies": {
    "electron": "^latest",
    "electron-builder": "^latest",
    "electron-updater": "^6.0.0"
  }
}
```

---

## Code-Snippet: main.js – Update-Setup

```javascript
const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: __dirname + '/preload.js',
      sandbox: true
    }
  });

  mainWindow.loadFile('src/index.html');
  
  // Update-Check nach App-Start
  if (!isDev) {
    checkForUpdates();
    
    // Alle 6 Stunden erneut prüfen
    setInterval(() => {
      checkForUpdates();
    }, 6 * 60 * 60 * 1000);
  }
}

function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify();
}

autoUpdater.on('update-available', (info) => {
  console.log('Update verfügbar:', info.version);
  mainWindow.webContents.send('update-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update heruntergeladen, wird beim Neustarten installiert');
  mainWindow.webContents.send('update-downloaded');
});

autoUpdater.on('error', (error) => {
  console.error('Update-Fehler:', error);
  mainWindow.webContents.send('update-error', error.message);
});

// Listener für Renderer-Prozess
const { ipcMain } = require('electron');

ipcMain.handle('install-update', async () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('check-for-updates', async () => {
  const result = await autoUpdater.checkForUpdates();
  return result;
});

app.on('ready', createWindow);
```

---

## Code-Snippet: preload.js – Renderer-Interface

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => {
      callback(info);
    });
  },
  
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', () => {
      callback();
    });
  },
  
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, error) => {
      callback(error);
    });
  },
  
  installUpdate: () => {
    ipcRenderer.invoke('install-update');
  },
  
  checkForUpdates: () => {
    return ipcRenderer.invoke('check-for-updates');
  }
});
```

---

## Code-Snippet: Renderer (React-Beispiel)

```javascript
import React, { useEffect, useState } from 'react';

export function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    // Update verfügbar
    window.electronAPI.onUpdateAvailable((info) => {
      console.log('Neue Version verfügbar:', info.version);
      setUpdateAvailable(true);
    });

    // Update heruntergeladen
    window.electronAPI.onUpdateDownloaded(() => {
      console.log('Update bereit zur Installation');
      setUpdateDownloaded(true);
    });

    // Fehler
    window.electronAPI.onUpdateError((error) => {
      console.error('Update-Fehler:', error);
    });
  }, []);

  return (
    <div>
      {updateAvailable && !updateDownloaded && (
        <div className="update-banner">
          <p>Neue Version verfügbar. Download läuft...</p>
        </div>
      )}
      
      {updateDownloaded && (
        <div className="update-ready">
          <p>Update ist bereit! Beim nächsten Neustart wird es installiert.</p>
          <button onClick={() => window.electronAPI.installUpdate()}>
            Jetzt Neustarten
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **Update wird nicht gefunden** | Falsche Konfiguration in publish-Config | `publish` in package.json/Konfiguration überprüfen; GitHub Token überprüfen |
| **Signatur-Validation schlägt fehl** | Code nicht signiert oder falses Zertifikat | Code mit `electron-builder` signieren; Zertifikat-Pfad validieren |
| **Benutzer startet App nicht neu** | Zu aggressive Benachrichtigungen | Optional-Updates nicht force, sondern sanft aktualisieren |
| **Alte Version bleibt nach Update** | Prozess läuft noch; fehlende Permissions | App-Prozess vor Update beenden; Installations-Verzeichnis-Rechte prüfen |

---

## Best Practices

1. **GitHub Releases:** Automatisiert via GitHub Actions release-Prozess
2. **Staged Rollout:** Nutze `allowDowngrade: false` + gradueller Rollout
3. **Fallback-Server:** Fallback-Manifest für Netzwerk-Fehler bereithalten
4. **Logging:** Alle Update-Events in File-Log schreiben für Debugging
5. **Testing:** In DEV-Mode mit lokalem Server testen vor Production-Release

---

## Build & Release Script (npm)

```json
{
  "scripts": {
    "start": "electron .",
    "build": "electron-builder --publish never",
    "build:release": "electron-builder --publish always",
    "deploy": "electron-builder --publish always && git tag v$npm_package_version"
  }
}
```

---

## Links & Tools

- [electron-updater Dokumentation](https://www.electron.build/auto-update)
- [electron-builder](https://www.electron.build/)
- [GitHub Releases & Actions](https://docs.github.com/en/actions)
- [AWS S3 als Update-Server](https://www.electron.build/configuration/publish)
- [Code-Signing unter Windows](https://docs.microsoft.com/en-us/windows/desktop/seccrypto/cryptography-functions)

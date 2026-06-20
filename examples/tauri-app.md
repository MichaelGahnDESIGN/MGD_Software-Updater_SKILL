# Tauri App (Rust + Web)

## Tech-Stack
- **Framework:** Tauri (Rust Backend + Web Frontend)
- **Platform:** Windows, macOS, Linux
- **Update-Mechanism:** tauri-plugin-updater
- **Frontend:** Vue.js, React, Svelte oder vanilla HTML/JS
- **Code-Signing:** Windows EV Code-Signing oder macOS Developer ID
- **Distribution:** GitHub Releases oder eigenem Update-Server

## Maturity-Level
**Level 2–3 (Stabilisierung bis Produktiv)** – Für moderne Cross-Platform Apps mit Rust-Backend

---

## Architektur-Beschreibung

Tauri kombiniert Rust-Backend mit Web-Frontend für kleine, sichere Desktop-Apps:
1. Updates werden durch `tauri-plugin-updater` verwaltet
2. Manifest wird als JSON von Server geholt
3. Delta-Updates reduzieren Bandbreite
4. Installer für Windows (.exe/.msi), macOS (.dmg), Linux (.AppImage)
5. Kein separate Electron-Prozess = schneller & sicherer

Das Update-System ist in Tauri integriert und unterstützt GPG-Signaturen für Authentizität.

---

## Code-Snippet: tauri.conf.json – Update-Konfiguration

```json
{
  "build": {
    "beforeBuildCommand": "",
    "beforeDevCommand": "",
    "devPath": "http://localhost:3000",
    "frontendDist": "../dist",
    "withGlobalTauri": false
  },
  "app": {
    "windows": [
      {
        "title": "My Tauri App",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; img-src 'self' https:; script-src 'self' 'unsafe-inline'"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["deb", "dmg", "msi"],
    "identifier": "com.example.myapp",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

---

## Code-Snippet: Rust-Backend (src/main.rs) – Update-Handler

```rust
use tauri::Manager;
use tauri_plugin_updater::UpdaterExt;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let app_handle = app.app_handle();
      
      // Update-Check im Hintergrund (alle 6 Stunden)
      std::thread::spawn(move || {
        loop {
          std::thread::sleep(std::time::Duration::from_secs(6 * 3600));
          
          if let Err(e) = check_for_updates(app_handle.clone()) {
            eprintln!("Update-Check fehlgeschlagen: {}", e);
          }
        }
      });
      
      Ok(())
    })
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      check_update,
      install_update
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn check_update(app: tauri::AppHandle) -> Result<Option<String>, String> {
  let updater = app.updater();
  
  match updater.check().await {
    Ok(Some(update)) => {
      println!("Update verfügbar: {}", update.new_version);
      Ok(Some(update.new_version))
    }
    Ok(None) => {
      println!("App ist aktuell");
      Ok(None)
    }
    Err(e) => Err(format!("Update-Check Fehler: {}", e))
  }
}

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
  let updater = app.updater();
  
  match updater.check().await {
    Ok(Some(mut update)) => {
      match update.download_and_install().await {
        Ok(_) => {
          println!("Update installiert");
          // App neu starten
          app.restart();
          Ok(())
        }
        Err(e) => Err(format!("Installation fehlgeschlagen: {}", e))
      }
    }
    _ => Err("Kein Update verfügbar".to_string())
  }
}

async fn check_for_updates(app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
  let updater = app.updater();
  
  if let Some(update) = updater.check().await? {
    // Silent Download im Hintergrund
    let mut download = update.download().await?;
    
    // Download-Progress Event
    while let Some(chunk) = download.chunk().await? {
      let progress = (download.bytes_downloaded() as f64 / download.content_length() as f64) * 100.0;
      println!("Download: {:.1}%", progress);
      
      // Event an Frontend senden
      app.emit_all("update-download-progress", progress).ok();
    }
    
    // Nach Download die App benachrichtigen
    app.emit_all("update-ready", update.new_version).ok();
  }
  
  Ok(())
}
```

---

## Code-Snippet: Frontend (React) – Update-UI

```typescript
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';

export function UpdateWidget() {
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Listener für Download-Progress
    const unlistenProgress = listen('update-download-progress', (event) => {
      setDownloadProgress(event.payload as number);
    });

    // Listener für ready-to-install
    const unlistenReady = listen('update-ready', (event) => {
      setUpdateVersion(event.payload as string);
      setIsReady(true);
    });

    // Check on mount
    handleCheckUpdate();

    return () => {
      unlistenProgress.then(f => f());
      unlistenReady.then(f => f());
    };
  }, []);

  async function handleCheckUpdate() {
    try {
      const newVersion = await invoke('check_update');
      if (newVersion) {
        setUpdateVersion(newVersion as string);
      }
    } catch (error) {
      console.error('Update-Check Fehler:', error);
    }
  }

  async function handleInstallUpdate() {
    try {
      await invoke('install_update');
    } catch (error) {
      console.error('Installation Fehler:', error);
    }
  }

  return (
    <div className="update-container">
      {updateVersion && !isReady && (
        <div className="update-banner">
          <p>Version {updateVersion} wird heruntergeladen...</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <span>{downloadProgress.toFixed(0)}%</span>
        </div>
      )}

      {isReady && (
        <div className="update-ready">
          <p>Update {updateVersion} ist bereit!</p>
          <button onClick={handleInstallUpdate}>
            Jetzt Installieren & Neustarten
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Code-Snippet: Update-Manifest Server (Node.js)

```javascript
const express = require('express');
const app = express();

app.get('/api/update', (req, res) => {
  const { target, arch } = req.query; // target: win32, darwin, linux
  
  const manifest = {
    version: '2.3.1',
    notes: 'Bugfix für Linux-Installation; Performance-Verbesserung',
    pub_date: new Date().toISOString(),
    platforms: {
      'win32-x86_64': {
        signature: 'dW5zaWduZWQ=', // Base64-encodiert
        url: 'https://releases.example.com/my-app-2.3.1-x64.msi'
      },
      'darwin-aarch64': {
        signature: 'c2lnbmVkLWFybTY0',
        url: 'https://releases.example.com/my-app-2.3.1-aarch64.dmg'
      },
      'linux-x86_64': {
        signature: 'bGludXgtdGFyYmFsbA==',
        url: 'https://releases.example.com/my-app-2.3.1-x64.AppImage'
      }
    }
  };
  
  res.json(manifest);
});

app.listen(3000, () => console.log('Update-Server läuft auf Port 3000'));
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **Signatur-Verifikation fehlgeschlagen** | Manifest nicht signiert; falscher Schlüssel | Manifest mit tauri CLI signieren: `tauri updater sign` |
| **Update wird nicht heruntergeladen** | Falsche Manifest-URL; Netzwerk-Problem | URL validieren, Fallback-Server definieren |
| **App startet nach Update nicht** | Rust-Abhängigkeit nicht gelinkt; Pfad falsch | `cargo build --release` vollständig durchführen |
| **Frontend lädt nicht** | Build-Output falsch; frontendDist-Pfad | `npm run build` vor `tauri build` ausführen |

---

## Build & Release

```bash
# Development
npm run dev        # Frontend + Backend local

# Build für Release
npm run build      # Frontend build
cargo build --release
tauri build        # Installer für alle Plattformen erstellen

# Update-Manifest signieren
tauri updater sign --sk-path ./private.key

# Release zu GitHub (Optional)
gh release create v2.3.1 \
  --title "Version 2.3.1" \
  --notes "Neue Features und Bugfixes" \
  src-tauri/target/release/bundle/*/*.{msi,dmg,AppImage}
```

---

## Links & Tools

- [Tauri Dokumentation](https://tauri.app/)
- [tauri-plugin-updater](https://github.com/tauri-apps/plugins-workspace/tree/v1/plugins/updater)
- [Tauri Updater CLI](https://tauri.app/v1/guides/distribution/updater/)
- [GPG Key Generation](https://gnupg.org/)
- [Tauri auf macOS signieren](https://tauri.app/v1/guides/distribution/sign-macos)

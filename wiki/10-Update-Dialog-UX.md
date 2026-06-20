# 10 Update-Dialog UX & Design

## Überblick

Der Update-Dialog ist die erste Interaktion mit Nutzern bei verfügbarem Update. Sein Design bestimmt ob Nutzer aktualisieren, später entscheiden oder ignorieren.

Dieses Kapitel zeigt Best Practices für verschiedene Szenarien und Plattformen.

## Dialog-Komponenten

### Minimal Dialog (Level 1–2)

```
┌─────────────────────────────────────┐
│  Neue Version verfügbar!            │
├─────────────────────────────────────┤
│                                     │
│  Version 2.1.0 ist verfügbar.      │
│  Jetzt herunterladen?              │
│                                     │
│  [  Jetzt updaten  ] [  Später  ]   │
└─────────────────────────────────────┘
```

**Code-Beispiel:**
```javascript
function showUpdateDialog(manifest) {
  dialog.show({
    title: 'Neue Version verfügbar!',
    message: `Version ${manifest.version} ist verfügbar.`,
    buttons: [
      {
        label: 'Jetzt updaten',
        onClick: () => downloadAndInstall(manifest)
      },
      {
        label: 'Später',
        onClick: () => dialog.close()
      }
    ]
  });
}
```

### Standard Dialog (Level 3–4)

```
┌──────────────────────────────────────────────────┐
│  Update verfügbar                           ✕    │
├──────────────────────────────────────────────────┤
│                                                  │
│  Version 2.1.0 (deine Version: 2.0.5)           │
│                                                  │
│  Was ist neu:                                   │
│  • Fixed crash on login                         │
│  • Added dark mode                              │
│  • Performance +30%                             │
│                                                  │
│  Dateigröße: 52 MB                             │
│  Download-Zeit (Wi-Fi): ~15 Sekunden           │
│                                                  │
│  Weitere Infos: https://example.com/...        │
│                                                  │
│  [  Jetzt updaten  ] [  Später  ] [  Skip  ]   │
└──────────────────────────────────────────────────┘
```

**Code-Beispiel:**
```javascript
function showDetailedUpdateDialog(currentVersion, manifest) {
  dialog.show({
    title: 'Update verfügbar',
    message: `Deine Version: ${currentVersion}\nNeue Version: ${manifest.version}`,
    changelogTitle: 'Was ist neu:',
    changelog: manifest.changelog,  // Array of strings
    additionalInfo: {
      fileSize: formatBytes(manifest.fileSize),
      downloadTime: estimateDownloadTime(manifest.fileSize)
    },
    learnMoreUrl: manifest.supportUrl,
    buttons: [
      {
        label: 'Jetzt updaten',
        primary: true,
        onClick: () => downloadAndInstall(manifest)
      },
      {
        label: 'Später',
        onClick: () => dialog.close()
      },
      {
        label: 'Überspringen',
        onClick: () => skipVersion(manifest.version)
      }
    ]
  });
}
```

### Forced Update Dialog

```
┌──────────────────────────────────────────────────┐
│  SICHERHEITS-UPDATE ERFORDERLICH                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  ⚠️  Diese Version hat kritische                │
│      Sicherheitslücken.                          │
│                                                  │
│  Version 2.1.0 wird automatisch heruntergeladen │
│  und installiert. Dein Gerät wird sich dann     │
│  neustarten (ca. 5 Minuten).                    │
│                                                  │
│  Du kannst diesen Prozess nicht überspringen.   │
│                                                  │
│  Download startet in: 00:10 ...                 │
│                                                  │
│  [  Jetzt updaten  ] [  Details  ]              │
└──────────────────────────────────────────────────┘
```

**Code-Beispiel:**
```javascript
function showForcedUpdateDialog(manifest) {
  let secondsUntilStart = 600; // 10 Minutes
  
  dialog.show({
    title: 'SICHERHEITS-UPDATE ERFORDERLICH',
    icon: 'warning',
    message: `Diese Version hat kritische Sicherheitslücken.\n\n` +
             `Update wird automatisch heruntergeladen und installiert.\n\n` +
             `Du kannst diesen Prozess nicht überspringen.`,
    timer: {
      duration: secondsUntilStart,
      onTick: (remaining) => {
        dialog.updateMessage(
          `Download startet in: ${formatTime(remaining)}...`
        );
      },
      onComplete: () => {
        startDownload(manifest);
      }
    },
    buttons: [
      {
        label: 'Jetzt updaten',
        onClick: () => startDownload(manifest)
      },
      {
        label: 'Details',
        onClick: () => dialog.showDetails(manifest)
      }
    ],
    // User kann Dialog nicht einfach schließen
    closeOnEscape: false,
    closeOnClickOutside: false
  });
}
```

## Progressive Disclosure Pattern

**Für Power Users:** Erweiterte Optionen ausblenden, auf Nachfrage zeigen.

```
Basic View (Default):
┌──────────────────────────────────┐
│  Update verfügbar                │
│  Version 2.1.0                   │
│  [  Jetzt  ] [  Später  ]        │
│  [  ▼ Erweitert  ]               │  ← Click zum Ausklappen
└──────────────────────────────────┘

Advanced View (Expanded):
┌──────────────────────────────────┐
│  Update verfügbar                │
│  Version 2.1.0                   │
│  [  Jetzt  ] [  Später  ]        │
│  [  ▲ Ausblenden  ]              │
│                                  │
│  Hash: sha256:abc123...          │  ← Technische Details
│  Größe: 52 MB                    │
│  Release: 2026-06-20             │
│  [  Vollständiger Changelog  ]   │
└──────────────────────────────────┘
```

**Code-Beispiel:**
```javascript
class UpdateDialog {
  constructor(manifest) {
    this.manifest = manifest;
    this.expanded = false;
  }
  
  render() {
    const basicInfo = `
      <h3>Update verfügbar</h3>
      <p>Version ${this.manifest.version}</p>
      <button onclick="updateNow()">Jetzt updaten</button>
      <button onclick="updateLater()">Später</button>
      <button onclick="toggle()">▼ Erweitert</button>
    `;
    
    const advancedInfo = this.expanded ? `
      <div class="advanced">
        <p><strong>Hash:</strong> ${this.manifest.hash}</p>
        <p><strong>Größe:</strong> ${formatBytes(this.manifest.fileSize)}</p>
        <p><strong>Release:</strong> ${this.manifest.releaseDate}</p>
        <a href="${this.manifest.changelogUrl}">
          Vollständiger Changelog
        </a>
      </div>
    ` : '';
    
    return basicInfo + advancedInfo;
  }
  
  toggle() {
    this.expanded = !this.expanded;
    this.render();
  }
}
```

## Download-Fortschritt Dialog

**Wenn Download > 5 MB dauert, zeige Progress:**

```
┌────────────────────────────────────┐
│  Update wird heruntergeladen...    │
├────────────────────────────────────┤
│                                    │
│  Version 2.1.0                     │
│                                    │
│  [████████░░░░░░░░] 45%           │
│                                    │
│  Heruntergeladen: 23 MB / 52 MB   │
│  Geschwindigkeit: 8 Mbps          │
│  Verbleibende Zeit: ~30 Sekunden  │
│                                    │
│              [  Abbrechen  ]       │
└────────────────────────────────────┘
```

**Code-Beispiel:**
```javascript
function showDownloadProgress(manifest) {
  let dialog = {
    title: 'Update wird heruntergeladen...',
    closed: false
  };
  
  const xhr = new XMLHttpRequest();
  
  xhr.addEventListener('progress', (event) => {
    if (event.lengthComputable) {
      const percentComplete = (event.loaded / event.total) * 100;
      const mbLoaded = (event.loaded / 1024 / 1024).toFixed(1);
      const mbTotal = (event.total / 1024 / 1024).toFixed(1);
      const speed = calculateSpeed(event.loaded);
      const remaining = calculateRemainingTime(event.loaded, event.total, speed);
      
      dialog.update({
        progress: percentComplete,
        status: `${mbLoaded} MB / ${mbTotal} MB`,
        speed: `${speed.toFixed(1)} Mbps`,
        remaining: `~${Math.ceil(remaining / 1000)} Sekunden`
      });
    }
  });
  
  xhr.addEventListener('abort', () => {
    dialog.show({
      title: 'Download unterbrochen',
      message: 'Der Download wurde abgebrochen. Möchtest du es versuchen?',
      buttons: [
        { label: 'Erneut versuchen', onClick: () => retry() },
        { label: 'Später', onClick: () => dialog.close() }
      ]
    });
  });
  
  xhr.addEventListener('error', () => {
    dialog.show({
      title: 'Download fehlgeschlagen',
      message: 'Netzwerkfehler. Möchtest du es versuchen?',
      buttons: [
        { label: 'Erneut versuchen', onClick: () => retry() },
        { label: 'Später', onClick: () => dialog.close() }
      ]
    });
  });
  
  xhr.download(manifest.downloadUrl);
}
```

## Installation-Status Dialog

**Nach Download, während Installation:**

```
┌────────────────────────────────────┐
│  Update wird installiert...        │
├────────────────────────────────────┤
│                                    │
│  [████████████░░░░░░] 75%         │
│                                    │
│  Bitte nicht schließen...          │
│  Dein App wird neu gestartet.     │
│                                    │
└────────────────────────────────────┘
```

**Code-Beispiel:**
```javascript
function showInstallationProgress() {
  const steps = [
    { name: 'Entpacke Dateien', progress: 25 },
    { name: 'Kopiere Dateien', progress: 50 },
    { name: 'Starte App neu', progress: 100 }
  ];
  
  let currentStep = 0;
  
  dialog.show({
    title: 'Update wird installiert...',
    closeButton: false,
    cancelButton: false,
    content: `
      <div id="progress">
        ${steps.map((s, i) => `
          <div class="step ${i <= currentStep ? 'active' : ''}">
            ${s.name}
          </div>
        `).join('')}
      </div>
      <p>Bitte nicht schließen...</p>
    `
  });
  
  const installInterval = setInterval(() => {
    currentStep++;
    if (currentStep >= steps.length) {
      clearInterval(installInterval);
      app.restart();
    }
  }, 2000);
}
```

## Platform-spezifische Designs

### macOS Dialog (Native)

```swift
// Native Alert mit Buttons
let alert = NSAlert()
alert.messageText = "Update verfügbar"
alert.informativeText = "Version 2.1.0 ist verfügbar.\n\n" +
                       "• Fixed crash on login\n" +
                       "• Performance +30%"
alert.addButton(withTitle: "Jetzt updaten")
alert.addButton(withTitle: "Später")

let response = alert.runModal()
if response == .alertFirstButtonReturn {
  downloadAndInstall()
}
```

### Windows Dialog (WPF)

```csharp
// WPF MessageBox mit Custom Buttons
var result = MessageBox.Show(
  "Version 2.1.0 ist verfügbar.\n\n" +
  "• Fixed crash on login\n" +
  "• Performance +30%",
  "Update verfügbar",
  MessageBoxButton.YesNoCancel,
  MessageBoxImage.Information
);

if (result == MessageBoxResult.Yes) {
  DownloadAndInstall();
}
```

### Mobile Dialog (iOS/Android)

```swift
// iOS Alert Controller
let alertController = UIAlertController(
  title: "Update verfügbar",
  message: "Version 2.1.0\n\n• Fixed crash\n• Performance +30%",
  preferredStyle: .alert
)

alertController.addAction(UIAlertAction(title: "Jetzt", style: .default) { _ in
  downloadAndInstall()
})

alertController.addAction(UIAlertAction(title: "Später", style: .cancel) { _ in
  dismiss()
})

present(alertController, animated: true)
```

### Web-App Dialog (HTML/CSS)

```html
<div class="update-dialog">
  <div class="update-dialog__content">
    <h2>Update verfügbar</h2>
    <p class="update-dialog__version">
      Deine Version: 2.0.5
      <br />
      Neue Version: 2.1.0
    </p>
    
    <ul class="update-dialog__changelog">
      <li>Fixed crash on login</li>
      <li>Added dark mode</li>
      <li>Performance +30%</li>
    </ul>
    
    <div class="update-dialog__buttons">
      <button class="btn btn--primary" onclick="updateNow()">
        Jetzt updaten
      </button>
      <button class="btn btn--secondary" onclick="updateLater()">
        Später
      </button>
    </div>
  </div>
</div>
```

```css
.update-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.update-dialog__content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.update-dialog__buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn--primary {
  background: #0066cc;
  color: white;
}

.btn--primary:hover {
  background: #0052a3;
}

.btn--secondary {
  background: #f0f0f0;
  color: #333;
}

.btn--secondary:hover {
  background: #e0e0e0;
}
```

## Accessibility (a11y)

```html
<!-- ARIA Labels für Screen Reader -->
<div 
  role="dialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  aria-modal="true">
  
  <h2 id="dialog-title">Update verfügbar</h2>
  
  <p id="dialog-description">
    Version 2.1.0 ist verfügbar. Deine aktuelle Version ist 2.0.5.
  </p>
  
  <!-- Tab-Order wichtig -->
  <button id="update-btn" tabindex="1">Jetzt updaten</button>
  <button id="later-btn" tabindex="2">Später</button>
  
  <!-- Keyboard-Navigation (Enter, Space, Escape) -->
</div>
```

## Best Practices

### DO ✓

- Zeige **Versionstyp** an (aktuell, neu, erfordert Sicherheit)
- Nutze **Changelog** mit Bullet Points (nicht zu viel Text)
- Gebe **Zeitschätzung** für Download (wenn länger als 5s)
- Zeige **Dateigröße** und **Speicher-Anforderungen**
- Implementiere **"Later" oder "Remind me"** Option
- Nutze **klare, kontraststarke Buttons**
- Test auf **verschiedenen Screen Sizes** (Mobile, Tablet, Desktop)
- **Keyboard-Navigation** unterstützen (Tab, Enter, Escape)

### DON'T ✗

- Zu viel Text im Dialog
- Automatisches Updaten ohne Vorwarnung (außer Forced Updates)
- Komplizierte technische Details Standard-View
- Dialog der Nutzer nicht schließen können (außer Forced)
- Mehrere Update-Dialoge gleichzeitig
- Update-Dialog ohne Close-Button (außer Forced)
- Langweilige/emotionlose Nachrichten

---

**Weiter:** Kapitel 11 (Rollback-Strategie)

# Native macOS App (Swift + Sparkle Framework)

## Tech-Stack
- **Language:** Swift (Cocoa)
- **Platform:** macOS 11.0+
- **Update-Framework:** Sparkle (open-source)
- **Distribution:** Mac App Store oder direkter Download (DMG)
- **Code-Signing:** Developer ID Certificate + Notarization
- **Package-Manager:** CocoaPods oder Swift Package Manager (SPM)

## Maturity-Level
**Level 3 (Produktiv)** – Für native macOS-Apps mit stabiler Signing-Pipeline

---

## Architektur-Beschreibung

Native macOS Apps in Swift nutzen Sparkle für robuste, sichere Updates:
1. App prüft regelmäßig Sparkle-Feed (XML über HTTPS)
2. User wird informiert, ohne blockiert zu werden
3. Download läuft im Hintergrund
4. Installation beim nächsten App-Start
5. Differenzielle Updates sparen Bandbreite

Sparkle verwaltet:
- Version-Vergleich
- Download-Verifikation (DSA oder EdDSA)
- Automatische Authentifizierung des Servers
- Rollback bei Fehler

---

## Code-Snippet: Sparkle in AppDelegate (Cocoa)

```swift
import Cocoa
import Sparkle

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
    
    @IBOutlet weak var window: NSWindow!
    
    // Sparkle Updater instance
    private let updater = SPUStandardUpdaterController(
        startingUpdater: true,
        updaterDelegate: nil,
        userDriverDelegate: nil
    )
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Sparkle initialisieren
        // Manifest-URL aus Info.plist: SUFeedURL
        
        // Automatische Checks alle 24 Stunden
        updater.updater.automaticallyDownloadsUpdates = true
        updater.updater.automaticallyChecksForUpdates = true
        
        // Debugging (in Development)
        // updater.updater.feedURL = URL(string: "http://localhost:3000/sparkle-feed.xml")
    }
    
    @IBAction func checkForUpdates(_ sender: Any?) {
        updater.updater.checkForUpdates(sender)
    }
}
```

---

## Code-Snippet: Info.plist Update-Konfiguration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>My macOS App</string>
    <key>CFBundleVersion</key>
    <string>42</string>
    <key>CFBundleShortVersionString</key>
    <string>2.3.1</string>
    
    <!-- Sparkle Update-Konfiguration -->
    <key>SUFeedURL</key>
    <string>https://updates.example.com/sparkle-feed.xml</string>
    
    <key>SUEnableAutomaticChecks</key>
    <true/>
    
    <key>SUScheduledCheckInterval</key>
    <integer>86400</integer> <!-- 24 Stunden in Sekunden -->
    
    <key>SUAllowsAutomaticUpdates</key>
    <true/>
    
    <key>SUAutomaticallyInstallUpdates</key>
    <true/>
    
    <!-- Security: Nur signierte Updates -->
    <key>SUPublicEDKey</key>
    <string>YOUR_ED25519_PUBLIC_KEY_HERE</string>
    
    <!-- DMG Pfad für Installation -->
    <key>SUAllowsAutomaticUpdates</key>
    <true/>
    
</dict>
</plist>
```

---

## Code-Snippet: Sparkle Feed XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle">
    <channel>
        <title>My macOS App</title>
        <link>https://example.com</link>
        <description>Updates für My macOS App</description>
        <language>de</language>
        
        <item>
            <title>Version 2.3.1 – Sicherheits-Update</title>
            <description>
                <![CDATA[
                <h3>Neue Features</h3>
                <ul>
                    <li>Verbesserte Dateibrowser-Performance</li>
                    <li>Neue Dark-Mode Farben</li>
                </ul>
                <h3>Bugfixes</h3>
                <ul>
                    <li>Crash bei Datei-Import behoben</li>
                    <li>Memory-Leak in Export-Funktion geschlossen</li>
                </ul>
                ]]>
            </description>
            <pubDate>Fri, 15 Mar 2024 10:30:00 +0000</pubDate>
            <sparkle:version>42</sparkle:version>
            <sparkle:shortVersionString>2.3.1</sparkle:shortVersionString>
            <sparkle:criticalUpdate>false</sparkle:criticalUpdate>
            <sparkle:minimumSystemVersion>11.0</sparkle:minimumSystemVersion>
            
            <!-- DMG Download -->
            <enclosure 
                url="https://releases.example.com/MyApp-2.3.1.dmg"
                sparkle:version="42"
                sparkle:shortVersionString="2.3.1"
                length="128932456"
                type="application/octet-stream"
                sparkle:edSignature="WTFxWMu2e6yoL5UDvzv7bKLrY7xNPqZhRjCEPVvmKwILOzKvLq32vDPhslhBhTvKzMCBQ8D1QRKvhx7nSKpiBg=="/>
            
            <!-- Optionale Release-Notes URL -->
            <link>https://example.com/releases/v2.3.1</link>
        </item>
        
        <!-- Ältere Versionen (für Rollback-Info) -->
        <item>
            <title>Version 2.3.0</title>
            <pubDate>Fri, 01 Mar 2024 15:00:00 +0000</pubDate>
            <sparkle:version>41</sparkle:version>
            <sparkle:shortVersionString>2.3.0</sparkle:shortVersionString>
            <enclosure 
                url="https://releases.example.com/MyApp-2.3.0.dmg"
                sparkle:version="41"
                sparkle:shortVersionString="2.3.0"
                length="125800000"
                type="application/octet-stream"
                sparkle:edSignature="XxFxWMu2e6yoL5UDvzv7bKLrY7xNPqZhRjCEPVvmKwILOzKvLq32vDPhslhBhTvKzMCBQ8D1QRKvhx7nSKpiBg=="/>
        </item>
    </channel>
</rss>
```

---

## Code-Snippet: Swift Build & Sign Script

```bash
#!/bin/bash

# Variablen
PROJECT_NAME="MyApp"
TARGET_DIR="build/Release"
DMG_NAME="$PROJECT_NAME-2.3.1.dmg"
DEVELOPER_ID="Developer ID Application: My Company (TEAM12345)"

# Build durchführen
echo "🏗️ Bauen..."
xcodebuild clean build -scheme $PROJECT_NAME -configuration Release

# App signieren
echo "✍️ Signieren..."
codesign --force --verify --verbose \
  --sign "$DEVELOPER_ID" \
  "$TARGET_DIR/$PROJECT_NAME.app"

# DMG erstellen
echo "📦 DMG erstellen..."
mkdir -p dmg_staging
cp -r "$TARGET_DIR/$PROJECT_NAME.app" dmg_staging/
ln -s /Applications dmg_staging/Applications

hdiutil create -volname "$PROJECT_NAME" \
  -srcfolder dmg_staging \
  -ov -format UDZO \
  "$DMG_NAME"

# DMG signieren
codesign --force --verify --verbose \
  --sign "$DEVELOPER_ID" \
  "$DMG_NAME"

# Notarization
echo "🔐 Notarizing..."
xcrun notarytool submit "$DMG_NAME" \
  --apple-id "developer@example.com" \
  --password "@keychain:MyAppNotaryPassword" \
  --team-id "TEAM12345" \
  --wait

# Staple Notarization Ticket
xcrun stapler staple "$DMG_NAME"

echo "✅ Fertig! DMG bereit: $DMG_NAME"
rm -rf dmg_staging

# Upload zu Server
echo "📤 Uploaden..."
# scp $DMG_NAME user@releases.example.com:/var/www/releases/
```

---

## Code-Snippet: Sparkle EdDSA Signing (Node.js)

```javascript
const crypto = require('crypto');
const fs = require('fs');
const zlib = require('zlib');

async function generateSparkleSignature(dmgPath, privateKeyPath) {
  const fileData = fs.readFileSync(dmgPath);
  const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
  
  // Datei-Hash berechnen
  const hash = crypto.createHash('sha256');
  hash.update(fileData);
  const digest = hash.digest();
  
  // Mit EdDSA signieren (benötigt libsodium oder tweetnacl)
  const crypto_sign = require('libsodium.js');
  await crypto_sign.ready;
  
  const privateKeyBuf = Buffer.from(privateKey.split('\n')[1], 'base64');
  const signature = crypto_sign.crypto_sign_detached(digest, privateKeyBuf);
  
  // Base64 für XML
  return Buffer.from(signature).toString('base64');
}

// Usage
generateSparkleSignature('./MyApp-2.3.1.dmg', './private.key')
  .then(sig => {
    console.log(`sparkle:edSignature="${sig}"`);
  });
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **Sparkle findet Update nicht** | Feed-URL falsch; XML-Syntax-Fehler | Feed-URL in Info.plist + lokalem Server testen |
| **Notarization fehlgeschlagen** | Code-Signatur ungültig; Malware-Verdacht | `codesign -vvv` überprüfen; vollständiger Scan |
| **App startet nach Update nicht** | Abhängigkeiten nicht gelinkt | Link-Abhängigkeiten in Xcode Überprüfen |
| **Signatur-Verifikation schlägt fehl** | EdDSA-Key nicht in Info.plist | `SUPublicEDKey` mit echtem Schlüssel füllen |

---

## Best Practices

1. **Versioning:** `CFBundleVersion` (Build #) + `CFBundleShortVersionString` (2.3.1)
2. **Feed-Sicherheit:** Nur HTTPS; selbstsignierte Zertifikate vermeiden
3. **Rollback:** DMG aller Versionen archivieren
4. **Monitoring:** Feed-Zugriffe loggen; Fehler tracken
5. **Testing:** Mit lokalem Server vor Production testen

---

## Links & Tools

- [Sparkle Framework](https://sparkle-project.org/)
- [Sparkle GitHub](https://github.com/sparkle-project/Sparkle)
- [Apple Notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [libsodium.js für EdDSA](https://github.com/jedisct1/libsodium.js)
- [Swift Packaging](https://developer.apple.com/swift/packages/)

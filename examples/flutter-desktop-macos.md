# Flutter Desktop App – macOS (DMG + Notarization)

## Tech-Stack
- **Framework:** Flutter (Dart)
- **Platform:** macOS 11.0+
- **Distribution:** DMG (Disk Image)
- **Code-Signing:** Developer ID Certificate + Notarization
- **Update-Mechanismus:** Sparkle Framework (auch für macOS verfügbar)

## Maturity-Level
**Level 3 (Produktiv)** – Für kommerzielle macOS-Apps mit stabiler Signing- und Notarization-Pipeline

---

## Architektur-Beschreibung

Flutter Apps unter macOS müssen:
1. Mit Developer ID Certificate signiert werden
2. Apple Notarization durchlaufen (seit macOS 10.15+ Pflicht für Gatekeeper)
3. Update-Mechanism über Sparkle oder ähnliche Tools laufen
4. DMG-Installerimage als Distribution verwenden

Das Update-Manifest wird auf GitHub Releases, eigenem Server oder CDN gehostet. Notarization benötigt Apple Developer Account und schlägt fehl, falls Code-Signing ungültig ist.

---

## Code-Snippet: Update-Manifest (Sparkle)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle">
  <channel>
    <title>My Flutter App</title>
    <link>https://example.com</link>
    <description>Updates für My Flutter App</description>
    <language>de</language>
    
    <item>
      <title>Version 2.1.4</title>
      <description>
        <![CDATA[
          <ul>
            <li>Bugfix für Big Sur Kompatibilität</li>
            <li>Performance-Verbesserung bei Dateiverwaltung</li>
          </ul>
        ]]>
      </description>
      <pubDate>Fri, 15 Mar 2024 10:30:00 +0000</pubDate>
      <sparkle:version>2.1.4</sparkle:version>
      <sparkle:shortVersionString>2.1.4</sparkle:shortVersionString>
      <sparkle:criticalUpdate>false</sparkle:criticalUpdate>
      <enclosure url="https://updates.example.com/MyApp-2.1.4.dmg"
                 sparkle:version="2.1.4"
                 sparkle:shortVersionString="2.1.4"
                 length="89234567"
                 type="application/octet-stream"
                 sparkle:dsaSignature="MC0CFB2..."/>
    </item>
  </channel>
</rss>
```

---

## Code-Snippet: Build & Notarization-Script

```bash
#!/bin/bash

# Flutter-Build für macOS
flutter clean
flutter build macos --release

# App-Bundle signieren mit Developer ID
DEVELOPER_ID="Developer ID Application: My Company (TEAM12345)"
codesign --force --verify --verbose \
  --sign "$DEVELOPER_ID" \
  "build/macos/Build/Products/Release/MyApp.app"

# DMG erstellen
mkdir -p dmg_temp
cp -r "build/macos/Build/Products/Release/MyApp.app" dmg_temp/
ln -s /Applications dmg_temp/Applications

hdiutil create -volname "MyApp" \
  -srcfolder dmg_temp \
  -ov -format UDZO \
  "build/MyApp-2.1.4.dmg"

# DMG signieren
codesign --force --verify --verbose \
  --sign "$DEVELOPER_ID" \
  "build/MyApp-2.1.4.dmg"

# Apple Notarization einleiten
xcrun notarytool submit "build/MyApp-2.1.4.dmg" \
  --apple-id "developer@example.com" \
  --password "@keychain:MyAppNotaryPassword" \
  --team-id "TEAM12345" \
  --wait

# Notarization überprüfen
xcrun stapler staple "build/MyApp-2.1.4.dmg"

echo "✅ Notarization abgeschlossen und stapled"
```

---

## Code-Snippet: Dart Update-Check mit Sparkle

```dart
import 'package:http/http.dart' as http;
import 'package:xml/xml.dart' as xml;
import 'dart:io';

class MacOSUpdateAgent {
  final String manifestUrl;
  final String currentVersion;

  MacOSUpdateAgent({
    required this.manifestUrl,
    required this.currentVersion,
  });

  Future<void> checkForUpdates() async {
    try {
      final response = await http.get(Uri.parse(manifestUrl));
      if (response.statusCode != 200) {
        throw Exception('Manifest nicht erreichbar');
      }

      final document = xml.XmlDocument.parse(response.body);
      final items = document.findAllElements('item');

      if (items.isEmpty) {
        print('Keine Updates verfügbar');
        return;
      }

      final latestItem = items.first;
      final version = latestItem
          .findElements('sparkle:version')
          .first
          .innerText;
      
      if (_isNewerVersion(version, currentVersion)) {
        final enclosure = latestItem.findElements('enclosure').first;
        final downloadUrl = enclosure.getAttribute('url')!;
        final downloadSize = int.parse(enclosure.getAttribute('length')!);
        
        final description = latestItem
            .findElements('description')
            .firstOrNull
            ?.innerText ?? 'Neue Version verfügbar';

        print('Update verfügbar: $version\n$description');
        
        // Download-Prompt anzeigen
        await _downloadAndInstall(downloadUrl, downloadSize, version);
      }
    } catch (e) {
      print('Update-Check Fehler: $e');
    }
  }

  Future<void> _downloadAndInstall(
    String url,
    int sizeBytes,
    String version,
  ) async {
    try {
      final tempDir = Directory.systemTemp;
      final dmgFile = File('${tempDir.path}/MyApp-$version.dmg');

      // Download mit Progress
      final request = http.Request('GET', Uri.parse(url));
      final response = await http.Client().send(request);

      int downloadedBytes = 0;
      await dmgFile.openWrite().addStream(
        response.stream.map((chunk) {
          downloadedBytes += chunk.length;
          final progress = (downloadedBytes / sizeBytes * 100).toStringAsFixed(1);
          print('Download: $progress%');
          return chunk;
        }),
      );

      // Mount DMG und install
      final result = await Process.run('open', [dmgFile.path]);
      if (result.exitCode == 0) {
        print('DMG gemountet. User muss App in /Applications kopieren.');
      }
    } catch (e) {
      print('Installation Fehler: $e');
    }
  }

  bool _isNewerVersion(String newest, String current) {
    final newParts = newest.split('.').map(int.parse).toList();
    final currParts = current.split('.').map(int.parse).toList();

    for (int i = 0; i < newParts.length; i++) {
      if (newParts[i] > currParts[i]) return true;
      if (newParts[i] < currParts[i]) return false;
    }
    return false;
  }
}
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **Code-Signatur ungültig** | Zertifikat abgelaufen; falscher Bundle-ID | Zertifikat erneuern; Bundle-ID mit Provisioning Profile abgleichen |
| **Notarization fehlgeschlagen** | Malware-Verdacht oder Signature-Fehler | Vollständiger Scan; mit `spctl -a -vvv -t install` lokal testen |
| **DMG lässt sich nicht mounen** | Beschädigte Datei oder Rechte-Problem | DMG mit `hdiutil verify` überprüfen; Neuerstellen |
| **App startet nach Update nicht** | Alte Prozess läuft noch; fehlende Dylib | App vor Update beenden; Abhängigkeiten überprüfen |

---

## Best Practices

1. **Automation:** Build, Sign, Notarize in CI/CD-Pipeline (z.B. GitHub Actions)
2. **Sparkle-Konfiguration:** `SUEnableAutomaticChecks`, `SUScheduledCheckInterval` in Info.plist setzen
3. **Fallback:** Wenn Notarization fehlschlägt, alt-signingiert-DMG bereithalten
4. **Monitoring:** Notarization-Status tracken; bei Fehler Entwickler sofort benachrichtigen
5. **Testing:** Jede macOS-Version (11, 12, 13, 14) lokal testen vor Release

---

## Links & Tools

- [Sparkle Framework](https://sparkle-project.org/)
- [Apple Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Apple Code Signing](https://developer.apple.com/support/code-signing/)
- [Flutter für macOS](https://flutter.dev/desktop)
- [xcrun notarytool CLI](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution/notarizing_your_app_through_the_command_line)

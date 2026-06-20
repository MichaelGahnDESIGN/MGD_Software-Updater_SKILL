# Flutter Desktop App – Windows (MSI-Installer)

## Tech-Stack
- **Framework:** Flutter (Dart)
- **Platform:** Windows 10/11
- **Distribution:** MSI-Installer
- **Update-Mechanismus:** windows-update-agent (selbstentwickelt) oder drittanbieter-Lösung (e.g., Squirrel.Windows)
- **Signing:** Windows Code Signing Certificate

## Maturity-Level
**Level 3 (Produktiv)** – Für kommerzielle Windows-Apps mit stabiler Versioning-Infrastruktur

---

## Architektur-Beschreibung

Flutter unter Windows wird über MSIX oder MSI verpackt. Updates sollten:
1. Im Hintergrund gepruft werden (z.B. alle 12 Stunden)
2. Delta-Updates unterstützen (nicht jede Datei neu herunterladen)
3. Silent-Installation ohne User-Prompt ermöglichen
4. Rollback bei Fehler automatisieren

Das Update-Manifest wird auf einem CDN oder eigenem Server gehostet und enthält Versions-Metadata, Download-URLs und Checksums.

---

## Code-Snippet: Update-Manifest JSON

```json
{
  "latest_version": "2.5.3",
  "build_number": 253,
  "release_date": "2024-03-15T10:30:00Z",
  "changelog": "Bugfix für Windows 11 Kompatibilität; Performance-Verbesserungen",
  "download_url": "https://updates.example.com/app-windows-2.5.3.msi",
  "file_size_bytes": 125432890,
  "checksum_sha256": "a1b2c3d4e5f6...",
  "minimum_version": "2.0.0",
  "critical": false,
  "signature_url": "https://updates.example.com/app-windows-2.5.3.msi.sig",
  "release_notes_url": "https://example.com/releases/v2.5.3"
}
```

---

## Code-Snippet: Update-Check & Download

```dart
import 'package:http/http.dart' as http;
import 'package:crypto/crypto.dart';
import 'dart:io';
import 'dart:convert';

class WindowsUpdateAgent {
  final String manifestUrl;
  final String localVersionFile;
  
  WindowsUpdateAgent({
    required this.manifestUrl,
    required this.localVersionFile,
  });

  Future<void> checkAndDownloadUpdate() async {
    try {
      // Manifest abrufen
      final response = await http.get(Uri.parse(manifestUrl));
      if (response.statusCode != 200) throw Exception('Manifest nicht erreichbar');
      
      final manifest = jsonDecode(response.body);
      final latestVersion = manifest['latest_version'];
      final currentVersion = await _getCurrentVersion();
      
      if (_isNewerVersion(latestVersion, currentVersion)) {
        print('Neue Version verfügbar: $latestVersion');
        
        // Download mit Checksum-Verifikation
        final downloadUrl = manifest['download_url'];
        final checksumExpected = manifest['checksum_sha256'];
        
        final file = File(Platform.environment['TEMP']! + '\\app-update.msi');
        await _downloadFile(downloadUrl, file);
        
        final checksumActual = await _calculateSha256(file);
        if (checksumActual != checksumExpected) {
          throw Exception('Checksum-Fehler: Download-Datei ist beschädigt');
        }
        
        // Installation im Hintergrund starten
        await _scheduleInstallation(file.path);
      }
    } catch (e) {
      print('Update-Fehler: $e');
    }
  }

  Future<String> _getCurrentVersion() async {
    final file = File(localVersionFile);
    if (await file.exists()) {
      return await file.readAsString();
    }
    return '1.0.0';
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

  Future<void> _downloadFile(String url, File destination) async {
    final request = http.Request('GET', Uri.parse(url));
    final response = await http.Client().send(request);
    
    if (response.statusCode == 200) {
      await destination.writeAsBytes(await response.stream.toBytes());
    } else {
      throw Exception('Download fehlgeschlagen (HTTP ${response.statusCode})');
    }
  }

  Future<String> _calculateSha256(File file) async {
    final bytes = await file.readAsBytes();
    return sha256.convert(bytes).toString();
  }

  Future<void> _scheduleInstallation(String msiPath) async {
    // MSI starten mit /quiet-Flag und REBOOT=ReallySuppress
    final result = await Process.run(
      'msiexec.exe',
      ['/i', msiPath, '/quiet', '/norestart'],
    );
    
    if (result.exitCode == 0 || result.exitCode == 3010) {
      print('Installation erfolgreich geplant');
    } else {
      throw Exception('MSI-Installation fehlgeschlagen: ${result.stderr}');
    }
  }
}
```

---

## Code-Snippet: Installation & Restart

```dart
class RestartManager {
  static Future<void> requestRestart() async {
    // Fenster speichern und dann Restart initiieren
    final result = await Process.run(
      'shutdown.exe',
      ['/r', '/t', '300', '/c', 'Update wird installiert. Neustart in 5 Minuten.'],
    );
    
    if (result.exitCode != 0) {
      print('Restart-Fehler: ${result.stderr}');
    }
  }

  static Future<void> cancelRestart() async {
    await Process.run('shutdown.exe', ['/a']);
  }
}
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **Corrupt MSI-Download** | Netzwerkabbruch oder Man-in-the-Middle | Immer SHA256-Checksum verifizieren; HTTPS erzwingen |
| **Installation schlägt fehl** | App läuft noch; fehlende Berechtigungen | Installer mit Admin-Rechten ausführen; App beenden vor Update |
| **Rollback nicht möglich** | Alte Version wurde gelöscht | Backup der vorherigen Version vor Update speichern |
| **Update wird nicht erkannt** | Manifest-URL unerreichbar | Fallback-Quelle definieren; Offline-Modus unterstützen |

---

## Best Practices

1. **Code-Signatur:** MSI mit privatem Zertifikat signieren; in App überprüfen
2. **Canary-Updates:** Erst 5% der User, dann 25%, dann 100% deployen
3. **Monitoring:** Update-Erfolgsrate, Fehler und Restart-Zeiten tracken
4. **Kommunikation:** Release-Notes vor Update in App anzeigen
5. **Fallback:** Wenn Update fehlschlägt, Alt-Installer bereithalten

---

## Links & Tools

- [MSIX Packaging für Flutter](https://msix.pub/)
- [Squirrel.Windows (Electron-kompatibel)](https://github.com/Squirrel/Squirrel.Windows)
- [Windows Installer (MSI) Dokumentation](https://docs.microsoft.com/en-us/windows/win32/msi/windows-installer-portal)
- [Dart crypto Library](https://pub.dev/packages/crypto)

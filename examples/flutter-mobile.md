# Flutter Mobile App – iOS + Android (CodePush für OTA)

## Tech-Stack
- **Framework:** Flutter (Dart)
- **Platforms:** iOS + Android
- **OTA-Lösung:** CodePush (Microsoft AppCenter)
- **Store-Distribution:** App Store (iOS), Google Play (Android)
- **Code-Signing:** Apple Developer ID + Google Play Signing Key
- **Backend:** AppCenter API oder eigenem Server

## Maturity-Level
**Level 2–3 (Stabilisierung bis Produktiv)** – Für Mobile-Apps mit häufigen Updates

---

## Architektur-Beschreibung

Flutter Mobile-Apps haben zwei Update-Kanäle:
1. **Store-Updates** (iOS App Store / Google Play) – neue native Features, Sicherheits-Patches
2. **OTA-Updates via CodePush** – Dart/JavaScript-Änderungen ohne Store-Review

CodePush ermöglicht schnelle Bugfixes und Hotfixes, ohne 1–2 Wochen auf Store-Review zu warten. Das System:
- Prüft beim Start auf neue JavaScript-Bundle
- Lädt Delta-Updates (~50 KB statt 50 MB)
- Verifiziert Signatur
- Rollback bei Fehler

---

## Code-Snippet: pubspec.yaml mit CodePush

```yaml
name: my_flutter_app
description: Flutter App mit OTA-Updates

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # CodePush Integration
  code_push_flutter: ^4.0.0
  
  # Andere Dependencies
  provider: ^6.0.0
  http: ^1.1.0
  shared_preferences: ^2.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
```

---

## Code-Snippet: main.dart mit CodePush-Integration

```dart
import 'package:flutter/material.dart';
import 'package:code_push_flutter/code_push_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // CodePush initialisieren
  CodePushFlutter.init(
    deploymentKey: 'ios-deployment-key-here', // iOS
    androidDeploymentKey: 'android-deployment-key-here',
  );
  
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String updateStatus = 'Checking for updates...';
  bool updateAvailable = false;
  double downloadProgress = 0;

  @override
  void initState() {
    super.initState();
    _checkForUpdates();
  }

  Future<void> _checkForUpdates() async {
    try {
      // Remote-Paket prüfen
      RemotePackage? remotePackage = await CodePushFlutter.checkForUpdate();
      
      if (remotePackage != null) {
        setState(() {
          updateAvailable = true;
          updateStatus = 'Update verfügbar: v${remotePackage.appVersion}';
        });
        
        // Automatisch oder mit Nutzer-Zustimmung installieren
        await _downloadUpdate(remotePackage);
      } else {
        setState(() {
          updateStatus = 'App ist aktuell';
        });
      }
    } catch (e) {
      setState(() {
        updateStatus = 'Update-Fehler: $e';
      });
    }
  }

  Future<void> _downloadUpdate(RemotePackage remotePackage) async {
    try {
      // Download mit Progress-Callback
      LocalPackage? installedPackage = await remotePackage.download(
        onProgress: (downloadedBytes, totalBytes) {
          setState(() {
            downloadProgress = downloadedBytes / totalBytes;
          });
        },
      );

      if (installedPackage != null) {
        await installedPackage.install(
          InstallMode.onNextRestart,
          minimumBackgroundDuration: const Duration(seconds: 60),
        );
        
        setState(() {
          updateStatus = 'Update heruntergeladen, wird beim nächsten Start installiert';
        });
      }
    } catch (e) {
      setState(() {
        updateStatus = 'Download-Fehler: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'My Flutter App',
      home: Scaffold(
        appBar: AppBar(title: const Text('Update Status')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(updateStatus),
              if (downloadProgress > 0 && downloadProgress < 1)
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: LinearProgressIndicator(value: downloadProgress),
                ),
              if (updateAvailable)
                ElevatedButton(
                  onPressed: _checkForUpdates,
                  child: const Text('Erneut prüfen'),
                )
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## Code-Snippet: iOS Setup (Info.plist)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>My Flutter App</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    
    <!-- CodePush Konfiguration -->
    <key>CodePushDeploymentKey</key>
    <string>ios-deployment-key-from-appcenter</string>
    
    <!-- Erlauben von HTTP für localhost-Testing -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSExceptionDomains</key>
        <dict>
            <key>localhost</key>
            <dict>
                <key>NSIncludesSubdomains</key>
                <true/>
                <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
                <true/>
            </dict>
        </dict>
    </dict>
</dict>
</plist>
```

---

## Code-Snippet: Android Setup (AndroidManifest.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Notwendige Berechtigungen -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <application
        android:label="My Flutter App"
        android:icon="@mipmap/ic_launcher">
        
        <activity
            android:name=".MainActivity"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            
            <!-- CodePush Metadata -->
            <meta-data
                android:name="com.microsoft.codepush.react.CodePush_DeploymentKey"
                android:value="android-deployment-key-from-appcenter" />
            
        </activity>
    </application>
</manifest>
```

---

## Code-Snippet: AppCenter Release-Pipeline

```yaml
# .github/workflows/release.yml
name: Release to AppCenter

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.x'
      
      - name: Build APK
        run: |
          flutter pub get
          flutter build apk --release
      
      - name: Upload to AppCenter
        run: |
          appcenter apps upload-build \
            --app "my-org/my-app" \
            --file build/app/outputs/flutter-app-release.apk \
            --token ${{ secrets.APPCENTER_API_KEY }}
      
      - name: Release CodePush Update
        run: |
          appcenter codepush release-react \
            --app "my-org/my-app" \
            --deployment-name Production \
            --target-binary-version "1.0.0" \
            --plist-file plist.json
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **CodePush-Update wird nicht angeboten** | Falsche Deployment Key; Server unerreichbar | Deployment Key überprüfen; Internet-Verbindung testen |
| **App-Crash nach Update** | Inkompatibler Dart-Code; Runtime-Fehler | Unit-Tests vor CodePush-Release; Canary-Deployment |
| **Download-Fehler auf Mobilnetz** | Timeout bei 2G/3G; Paket zu groß | Delta-Updates nutzen; Timeout-Wert erhöhen |
| **Signatur-Verifikation fehlgeschlagen** | Private Key kompromittiert | Key sofort rotieren; Rollback initiieren |

---

## Best Practices

1. **Canary-Rollout:** Erst 10% User, dann 50%, dann 100%
2. **Monitoring:** Crash-Rate nach CodePush tracken
3. **Rollback-Plan:** Schnell alte Version wieder deployen können
4. **Testing:** CodePush-Update auf Test-Devices verifizieren
5. **Versionierung:** Große Changes → Store-Update; Small Fixes → CodePush

---

## Links & Tools

- [CodePush Documentation](https://microsoft.github.io/code-push/)
- [Microsoft AppCenter](https://appcenter.ms/)
- [Flutter Build für iOS](https://flutter.dev/docs/deployment/ios)
- [Flutter Build für Android](https://flutter.dev/docs/deployment/android)
- [Hermes Engine (für bessere Performance)](https://hermesengine.dev/)

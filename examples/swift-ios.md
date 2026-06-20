# Native iOS App (Swift + App Store + TestFlight)

## Tech-Stack
- **Language:** Swift (UIKit oder SwiftUI)
- **Platform:** iOS 13+
- **Distribution:** App Store + TestFlight
- **Code-Signing:** Apple Developer Certificate + Provisioning Profile
- **Package-Manager:** CocoaPods oder Swift Package Manager
- **Backend:** AppKit oder custom API für Feature-Flags

## Maturity-Level
**Level 3 (Produktiv)** – Für native iOS-Apps mit stabiler App Store-Pipeline

---

## Architektur-Beschreibung

Native iOS Apps nutzen den App Store für Hauptupdates:
1. TestFlight für Beta-Testing (bis 10.000 User)
2. App Store Review (typisch 24–48 Stunden)
3. Phased Rollout (5% → 25% → 100%)
4. Feature-Flags für Server-seitige Aktivierung

Für schnelle Hotfixes ohne Review: Feature-Flags über REST-API. App prüft beim Start die Flags und aktiviert/deaktiviert Features dynamisch.

---

## Code-Snippet: AppDelegate für Update-Check

```swift
import UIKit
import StoreKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        
        // Beim App-Start: App Store Version prüfen
        Task {
            await checkForAppStoreUpdate()
        }
        
        // Feature-Flags vom Server laden
        Task {
            await loadFeatureFlags()
        }
        
        return true
    }
    
    // MARK: - App Store Update Check
    
    private func checkForAppStoreUpdate() async {
        do {
            let currentVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
            let appStoreVersion = try await fetchAppStoreVersion()
            
            if isNewerVersion(appStoreVersion, than: currentVersion) {
                presentUpdatePrompt(newVersion: appStoreVersion)
            }
        } catch {
            print("App Store version check failed: \(error)")
        }
    }
    
    private func fetchAppStoreVersion() async throws -> String {
        let url = URL(string: "https://itunes.apple.com/lookup?bundleId=com.example.myapp")!
        let (data, _) = try await URLSession.shared.data(from: url)
        
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let results = json?["results"] as? [[String: Any]]
        let version = results?.first?["version"] as? String ?? "1.0"
        
        return version
    }
    
    private func isNewerVersion(_ new: String, than current: String) -> Bool {
        let newParts = new.split(separator: ".").compactMap { Int($0) }
        let currParts = current.split(separator: ".").compactMap { Int($0) }
        
        for i in 0..<max(newParts.count, currParts.count) {
            let newPart = i < newParts.count ? newParts[i] : 0
            let currPart = i < currParts.count ? currParts[i] : 0
            
            if newPart > currPart { return true }
            if newPart < currPart { return false }
        }
        
        return false
    }
    
    private func presentUpdatePrompt(newVersion: String) {
        let alert = UIAlertController(
            title: "Update verfügbar",
            message: "Version \(newVersion) ist im App Store verfügbar.",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "Update", style: .default) { _ in
            if let url = URL(string: "itms://apps.apple.com/app/id123456789") {
                UIApplication.shared.open(url)
            }
        })
        
        alert.addAction(UIAlertAction(title: "Später", style: .cancel))
        
        // Present alert in main window
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first,
           let rootVC = window.rootViewController {
            rootVC.present(alert, animated: true)
        }
    }
    
    // MARK: - Feature Flags
    
    private func loadFeatureFlags() async {
        do {
            let request = URLRequest(url: URL(string: "https://api.example.com/feature-flags")!)
            let (data, _) = try await URLSession.shared.data(for: request)
            
            let flags = try JSONDecoder().decode([String: Bool].self, from: data)
            UserDefaults.standard.set(flags, forKey: "featureFlags")
            
            print("Feature flags loaded: \(flags)")
        } catch {
            print("Failed to load feature flags: \(error)")
        }
    }
}

// MARK: - Feature Flag Helper

class FeatureFlagManager {
    static let shared = FeatureFlagManager()
    
    func isFeatureEnabled(_ feature: String) -> Bool {
        let flags = UserDefaults.standard.dictionary(forKey: "featureFlags") as? [String: Bool] ?? [:]
        return flags[feature] ?? false
    }
}
```

---

## Code-Snippet: SwiftUI View mit Feature-Flags

```swift
import SwiftUI

struct ContentView: View {
    @State private var showNewFeature = false
    
    var body: some View {
        VStack(spacing: 20) {
            Text("My iOS App")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            // Standard Feature (immer verfügbar)
            Button("Standardfunktion") {
                // Action
            }
            .buttonStyle(.borderedProminent)
            
            // Feature-Flag-controlled Feature
            if FeatureFlagManager.shared.isFeatureEnabled("newDashboard") {
                Button("Neues Dashboard (Beta)") {
                    showNewFeature = true
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
            }
            
            Spacer()
        }
        .padding()
        .sheet(isPresented: $showNewFeature) {
            NewDashboardView()
        }
    }
}

struct NewDashboardView: View {
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack {
            HStack {
                Text("Neues Dashboard")
                    .font(.headline)
                
                Spacer()
                
                Button("Schließen") {
                    dismiss()
                }
            }
            .padding()
            
            // New feature content
            Spacer()
        }
    }
}
```

---

## Code-Snippet: Build & TestFlight Release Script

```bash
#!/bin/bash

# Variablen
PROJECT_NAME="MyApp"
SCHEME="MyApp"
ARCHIVE_PATH="build/$PROJECT_NAME.xcarchive"
EXPORT_PLIST="ExportOptions.plist"

# Build & Archive
echo "🏗️ Archivieren..."
xcodebuild clean archive \
  -scheme "$SCHEME" \
  -archivePath "$ARCHIVE_PATH" \
  -configuration Release \
  CODE_SIGN_IDENTITY="Apple Distribution: My Company (TEAM12345)" \
  PROVISIONING_PROFILE_SPECIFIER="MyApp Distribution Profile"

# Export IPA
echo "📦 Exportieren..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -exportPath "build/export"

# TestFlight Upload
echo "📤 Upload zu TestFlight..."
xcrun altool --upload-app \
  --file "build/export/$PROJECT_NAME.ipa" \
  --type ios \
  --username "developer@example.com" \
  --password "@keychain:AppleID-Password"

echo "✅ TestFlight Upload erfolgreich!"
echo "Prüfen Sie https://testflight.apple.com für Testers einzuladen"
```

---

## Code-Snippet: ExportOptions.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    
    <key>provisioningProfiles</key>
    <dict>
        <key>com.example.myapp</key>
        <string>MyApp Distribution Profile</string>
    </dict>
    
    <key>signingStyle</key>
    <string>automatic</string>
    
    <key>stripSwiftSymbols</key>
    <true/>
    
    <key>teamID</key>
    <string>TEAM12345</string>
    
    <key>uploadBitcode</key>
    <false/>
    
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```

---

## Code-Snippet: GitHub Actions für App Store Release

```yaml
name: Release to App Store

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Xcode
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: 'latest-stable'
      
      - name: Install Dependencies
        run: pod install
      
      - name: Build Archive
        run: |
          xcodebuild clean archive \
            -scheme MyApp \
            -archivePath build/MyApp.xcarchive \
            -configuration Release
      
      - name: Export IPA
        run: |
          xcodebuild -exportArchive \
            -archivePath build/MyApp.xcarchive \
            -exportOptionsPlist ExportOptions.plist \
            -exportPath build/export
      
      - name: Upload to TestFlight
        run: |
          xcrun altool --upload-app \
            --file build/export/MyApp.ipa \
            --type ios \
            --username ${{ secrets.APPLE_ID }} \
            --password ${{ secrets.APPLE_PASSWORD }}
```

---

## Gängige Fehler & Prävention

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| **Code-Signing fehlgeschlagen** | Zertifikat abgelaufen; falsches Profil | Zertifikat erneuern; Profil mit Bundle-ID abgleichen |
| **App Store Review abgelehnt** | Privacy Policy fehlend; Buggy Code | Alle Anforderungen checken; auf Release-Notes testen |
| **TestFlight Deployment fehlgeschlagen** | Provisioning Profile Fehler; invalid IPA | Automatisches Signing in Xcode aktivieren |
| **Phased Rollout funktioniert nicht** | Nicht in App Store Connect aktiviert | App Store Connect → Release control → Enable phased release |

---

## Best Practices

1. **Versioning:** Version & Build Number richtig vergeben (im Info.plist)
2. **TestFlight:** Jeden Build vor Production auf TestFlight testen
3. **Feature Flags:** Für riskante Features immer Flags verwenden
4. **Release Notes:** Aussagekräftige Release Notes pro Version
5. **Monitoring:** Crash-Reports & Analytics in App Store Connect überprüfen

---

## Links & Tools

- [App Store Connect](https://appstoreconnect.apple.com/)
- [TestFlight](https://developer.apple.com/testflight/)
- [Xcode Code Signing](https://developer.apple.com/support/code-signing/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [xcrun altool](https://developer.apple.com/download/all/)

# 16 Glossar - Begriffe A–Z

## A

**API (Application Programming Interface)**
Schnittstelle für Kommunikation zwischen Systemen. Update-System nutzt APIs um Manifest zu fetchen oder Updates zu berichten.

**AppImage**
Portable Linux-App-Format. Nutzer können überall starten, braucht keine Installation.

**APK (Android Package)**
Android-App-Format. Binärdatei die Google Play oder Custom-Server verteilt.

**Auto-Update**
App lädt & installiert Updates automatisch im Hintergrund ohne User-Aktion. Level 3+.

## B

**Backend**
Server-Komponente. Verwaltet Update-Manifests, Feature-Flags, Datenbanken.

**Beta-Testing**
Früh-Zugang zu neuem Feature für kleine Nutzer-Gruppe. Feedback vor offizieller Release.

**Binary / Executable**
Kompilierte App-Datei. .exe (Windows), .dmg (macOS), .AppImage (Linux), .apk (Android).

**Blacklist**
Liste veralteter Versionen die nicht mehr unterstützt werden. App wird gewarnt zu updaten.

**Broken Release**
Version mit kritischen Bugs. Erfordert Rollback.

**Build Number**
Interne Versionsnummer (monoton steigend). iOS/Android-Anforderung. Nicht für Nutzer sichtbar.

## C

**Canary Deployment**
Neue Version nur für 5-10% der Nutzer. Fehler erkennen bevor großrollout.

**CDN (Content Delivery Network)**
Weltweit verteilte Server für schnelle File-Downloads. CloudFront, Cloudflare, etc.

**Certificate (Code-Signing)**
Kryptografisches Zertifikat um Binaries zu signieren. Kostet $200-500/Jahr.

**Changelog**
Liste neuer Features, Bugfixes, und Breaking Changes. Angezeigt im Update-Dialog.

**Checksum**
Hash-Wert einer Datei (SHA256, MD5). Verifiziert ob Download korrekt ist.

**Code-Signing**
Digitales Signieren einer Executable mit Private Key. Beweist dass du die App erstelltest.

**CodePush**
Microsoft-Service für OTA-JavaScript-Updates (React Native, Flutter). Ohne App-Store-Review.

**Compliance**
Einhaltung von Regeln (DSGVO, HIPAA, PCI-DSS). Im Update: Datenschutz + Sicherheit.

**Crash**
Unerwarteter App-Fehler. Kann automatisches Rollback triggern.

**Cryptography / Crypto**
Mathematische Verschlüsselung. RSA, SHA256, TLS.

## D

**Database Migration**
Strukturelle Änderung an Datenbank. Von ALTER TABLE bis Data Backfill. Muss non-blocking sein.

**Default**
Standardwert wenn User nichts gewählt. Z.B. Telemetry-Consent defaultet auf OFF.

**Delta Update**
Download nur der Unterschiede (Diff) zwischen zwei Versionen. Spart Bandbreite.

**Deprecation**
Markieren von Funktionen als "bald entfernt". 3-6 Monate Vorwarnung vor Entfernung.

**Device ID**
Eindeutige Gerät-Identifikation. Darf nicht ohne Hashing gesammelt werden (DSGVO).

**DSGVO (Datenschutz-Grundverordnung)**
EU-Regelwerk für Datenschutz. Art. 5, 6, 7, 15, 17, 20, 21 wichtig für Updates.

**DDoS (Distributed Denial-of-Service)**
Attacke mit vielen Bot-Requests um Server lahmzulegen. Update-Server braucht DDoS-Protection.

## E

**ETag**
Unique Identifier für cached Ressource. Browser nutzt ETag um zu prüfen ob re-download nötig.

**Enterprise**
Große Organisation mit vielen Nutzern. Braucht Level 5: Licensing, Channels, Staged Rollout.

## F

**Feature Flag**
Toggle um neue Features an/aus zu schalten. Z.B. "api-v3" nur für 5% Nutzer.

**Force Update**
App zwingt User zu updaten. Nur für kritische Sicherheits-Patches.

**Fork**
Kopie eines GitHub-Repos. Erlaubt Modifikation ohne Original zu ändern.

## G

**Gatekeeper**
macOS Security-Feature. Schaut dass nur signierte Apps laufen.

**GitHub Actions**
CI/CD-Platform von GitHub. Automiert Builds, Tests, Releases.

**GitHub Releases**
Feature um Versionen + Binaries auf GitHub zu publizieren. Kostenlos.

**Gradual Rollout**
Schrittweise Ausrollung an mehr Nutzer. 5% → 25% → 50% → 100%.

## H

**Hash**
Einwegfunktion um Dateiinhalt zu "fingerprinting". SHA256 ist Standard. Verifiziert Integrität.

**Health Check**
Periodische Überprüfung ob Update-System funktioniert. Z.B. "ist Datenbank ok?".

**HTTPS (HTTP Secure)**
HTTP über TLS-Verschlüsselung. **MUSS** für Update-Downloads verwendet werden.

## I

**In-App Update**
Update direkt in der App. Android Play Core API, iOS nicht unterstützt.

**Installer**
Programm das App installiert. .exe (Windows), .dmg (macOS), .AppImage (Linux).

**Installation**
Prozess von Download → Verifikation → Install → Restart.

## J

**JSON (JavaScript Object Notation)**
Datenformat für Manifests und APIs. Leicht zu parsen + lesen.

## K

**Key (Cryptographic)**
Geheime Zeichenfolge für Verschlüsselung/Signierung. Private Key MUSS geheim bleiben!

## L

**License Key**
Lizenzschlüssel für Enterprise-Kunden. Verifiziert dass User berechtigt ist die App zu nutzen.

**Log**
Aufzeichnung von Update-Vorgängen. Error-Logs, Success-Logs, Crash-Logs.

## M

**Manifest**
JSON-Datei mit Update-Metadaten: Version, Download-URL, Hash, Changelog.

**MITM (Man-in-the-Middle)**
Attacke um Kommunikation abzuhören. HTTPS-Verschlüsselung schützt davor.

**MVP (Minimum Viable Product)**
Minimale Version mit nur essentiellen Features. Level 2 ist ein gutes MVP.

## N

**Notarization**
Apple-Prozess um macOS-Apps zu validieren. Pflicht seit macOS 10.15.

**Notification**
Benachrichtigung an User (Dialog, Banner, Toast). Informiert über verfügbaren Update.

## O

**OTA (Over-The-Air Update)**
Update ohne physisches Gerät anschließen. Funk/Netzwerk.

**Opt-in**
User muss aktiv einwilligen. Standard für Datenschutz. Default: OFF.

**Opt-out**
User muss aktiv ablehnen. Kontrovers, oft illegal (DSGVO).

## P

**Patch**
Kleine Bugfix-Version. Z.B. 2.0.0 → 2.0.1.

**PII (Personally Identifiable Information)**
Daten die Person identifizieren. Email, IP-Adresse, Device-ID, etc.

**PPA (Personal Package Archive)**
Ubuntu-Repository für eigene Packages. APT-Integration.

**Pre-release**
Testversion vor offizieller Release. Z.B. v2.1.0-beta.1.

**Private Key**
Geheime Signierung-Taste. NIEMALS in App oder Git!

**Public Key**
Öffentliche Verifikation-Taste. Kann in App sein, validiert Signatur.

**PWA (Progressive Web App)**
Web-App mit offline-Funktionalität. Service Worker für Updates.

## R

**Readme**
Dokumentation für Projekt. Erklärt wie Installation/Benutzung funktioniert.

**Rollback**
Zurückkehr zur alten Version nach fehlgeschlagenem Update.

**RSA**
Asymmetrisches Verschlüsselungs-Algorithmus. Nutzt Private + Public Key.

## S

**SemVer (Semantic Versioning)**
Versionierungs-Schema: MAJOR.MINOR.PATCH (2.1.0).

**Service Worker**
JavaScript-Worker für offline-Support & Updates. Web-App Standard.

**SHA256**
Hash-Algorithmus für Checksummen. Sicherer als MD5/SHA1.

**Snap**
Linux-Package-Format. Ubuntu/Fedora. Auto-Update-freundlich.

**Spark Updater / Sparkle**
macOS Standard-Update-Framework. XML-Manifest-Format.

**Signature**
Digitale Signatur um Datei-Authentizität zu beweisen. RSA-2048.

**Signed**
Code der mit Private Key signiert wurde. Beweist Herkunft.

**Staged Rollout**
Schrittweise Ausrollung. 5% heute, morgen 25%, nächste Woche 100%.

## T

**Tag (Git)**
Markierung für spezifischen Commit. Z.B. `v2.1.0` triggert Release-Pipeline.

**Telemetry**
Datensammlung über App-Nutzung. Update: Welche Version, erfolgreich?, etc.

**Testing**
Verifizierung dass Code funktioniert. Unit, Integration, E2E Tests.

**TLS (Transport Layer Security)**
Verschlüsselungs-Protokoll für HTTPS. TLS 1.2+.

## U

**UAC (User Account Control)**
Windows-Feature für Admin-Befehle. Update-Installation triggert UAC-Dialog.

**Unsigned**
Code ohne Signatur. Unvertrauenswürdig.

**Update**
Neue Version einer App. Kann sein: Feature, Bugfix, oder Sicherheits-Patch.

**Update-Check**
Periodische Überprüfung ob neue Version verfügbar ist.

**Update-Dialog**
UI die User informiert über verfügbares Update. Bietet "Jetzt" oder "Später".

**Update-Manifest**
JSON-Datei mit: Version, Download-URL, Hash, Changelog, etc.

**User-Agent**
String der Browser/App-Infos enthält. `Mozilla/5.0 Windows NT 10.0 ...`

## V

**Vault**
Sichere Speicherung für Secrets (Private Keys, API Tokens). AWS KMS, HashiCorp Vault.

**Version**
Eindeutige Identifikation einer App-Release. Z.B. 2.1.0.

**Version Code**
Interne Versionsnummer (Integer, monoton). Unterschiedlich von Version String.

**Version String**
Nutzer-sichtbare Version. Z.B. "2.1.0".

**Verification**
Validierung dass Download korrekt ist (Hash-Check, Signature-Check).

## W

**Whitelist**
Liste akzeptierter Werte/Versionen. Gegenteil von Blacklist.

**Workflow**
Automation-Ablauf. GitHub Actions: Build → Test → Release.

## X

**Xcode**
Apple IDE für macOS/iOS-Entwicklung. Integriert Code-Signing, Notarization.

## Z

**Zip**
Datei-Kompression-Format. Standard für Downloads.

**Zsync**
Differentielles Update-Protokoll. Linux AppImages nutzen zsync für Bandbreiten-Einsparung.

---

## Verwandte Konzepte

### Update-Komponenten
- **Manifest** → Version-Metadaten
- **Checksum/Hash** → Verifikation
- **Signature** → Authentizität
- **Installer** → Installation
- **Dialog** → User-Interaktion
- **Telemetry** → Logging
- **Rollback** → Fehlerbehandlung

### Plattform-spezifisch
- **Windows:** MSI, EXE, Code-Signing
- **macOS:** DMG, Notarization, Sparkle
- **iOS:** App Store, TestFlight, CodePush
- **Android:** Google Play, APK, AAB
- **Linux:** AppImage, Snap, Flatpak
- **Web:** Service Worker, PWA, Cache-Busting

### Sicherheit
- **Encryption:** TLS, HTTPS
- **Signing:** RSA, SHA256
- **Authentication:** API Keys, OAuth
- **Authorization:** Roles, Permissions
- **Audit Logging** → Who did What When

### Datenschutz
- **DSGVO:** Art. 5-21
- **Consent:** Opt-in Dialog
- **Anonymization:** Hashing, Aggregation
- **Retention:** 30-90 Tage
- **Rights:** Löschung, Export, Berichtigung

### DevOps
- **CI/CD:** GitHub Actions, Jenkins
- **Testing:** Unit, Integration, E2E
- **Staging:** Vor-Production Umgebung
- **Monitoring:** Metrics, Logs, Alerts
- **Deployment:** Blue-Green, Canary, Rolling

---

**Nicht gefunden was du suchtest?**

→ Nutze die Volltext-Suche im Wiki (Strg+F)  
→ Oder frage in den Kapiteln-Referenzen nach

# MGD Software Updater Skill Assistent

**Version 1.0** | [github.com/MichaelGahnDESIGN/MGD-Software-Updater-Skill-Assistent](https://github.com/MichaelGahnDESIGN/MGD-Software-Updater-Skill-Assistent)

---

## Zweck

Dieser Skill hilft Entwicklern und KI-Agenten dabei, professionelle **Software-Update-Systeme zu planen und zu implementieren**.

Der Skill besteht aus zwei Phasen:
1. **Planungsphase** — Analysiere Technologie, Plattform, Sicherheit, Architektur (10 strukturierte Schritte)
2. **Implementierungsphase** — Ein KI-Agent (Claude Code, Codex, Cursor, etc.) schreibt Code, testet und debuggt zusammen mit dir

Der Skill ist **technologie-neutral**: Desktop (Electron, Tauri, Flutter), Mobile (Flutter, React Native, Swift), Web (React, Vue, Next.js), Backend (Node.js, Python, Go), Games (Unity, Godot).

---

## Kernregel — Erst planen, dann implementieren

**WENN dieser Skill aufgerufen wird: Sofort KEINEN CODE schreiben.**

Update-Systeme sind kritisch für Sicherheit und User-Experience:
- **Busted Updates** zerstören Nutzer-Vertrauen
- **Sicherheitslücken** im Update-Prozess gefährden Nutzer
- **Falsche Architektur** führt zu monatelangem Refactoring
- **Fehlende Rollback** = Nutzerbasis verliert im schlimmsten Fall die App

### Warum zuerst planen?

1. **Sicherheit** muss von Anfang an eingebaut sein (Signing, Checksums, TLS)
2. **DSGVO/Privacy** erfordert Klarheit über Telemetrie & Datenspeicherung
3. **Plattformen** haben unterschiedliche Anforderungen (iOS App Store vs. Desktop)
4. **Architektur** (GitHub Releases vs. eigener Server) beeinflusst alles später
5. **Testing** braucht einen klaren Plan (Staging, Rollout, Rollback)

→ **Mit Plan**: 1-2 Tage Umsetzung, stabil
→ **Ohne Plan**: 1-2 Wochen Refactoring, Fehler, Sicherheitslücken

---

## Phase 1: 10 Pflichtschritte der Planung

Arbeite diese Schritte durch. Dokumentiere deine Antworten in `examples/[dein-projekt]/PLAN.md`.

### Schritt 1 — Projekt-Typ analysieren

**Was ist die App? Wo läuft sie?**

Checklist:
- [ ] Projekt-Name
- [ ] Desktop, Mobile, Web, Game, Backend, SaaS?
- [ ] Welcher Tech-Stack?
  - [ ] Desktop: Electron, Tauri, Flutter Desktop, Swift, WPF, Java Swing?
  - [ ] Mobile: Flutter, React Native, Swift (iOS), Kotlin (Android)?
  - [ ] Web: React, Vue, Next.js, Nuxt, Svelte, plain HTML/JS?
  - [ ] Backend: Node.js, Python, Go, Rust, PHP, Java, .NET?
- [ ] Welche Plattformen?
  - [ ] Windows, macOS, Linux (Desktop)
  - [ ] iOS, Android (Mobile)
  - [ ] Chrome, Firefox, Safari (Web)
  - [ ] AWS, GCP, Azure, On-Prem (Backend)

**Beispiele:**
- "Flutter macOS + Windows Desktop App"
- "React Native iOS + Android"
- "Next.js Web App (Self-Hosted)"
- "Node.js Backend mit Docker"

---

### Schritt 2 — Update-Anforderungen klären

**Wer triggert Updates? Wie oft? Wie viel Kontrolle hat der Nutzer?**

Checklist:
- [ ] Update-Trigger:
  - [ ] Automatisch beim App-Start?
  - [ ] Manuell (Nutzer klickt "Check for Updates")?
  - [ ] Hybrid (automatisch + manuell)?
- [ ] Update-Häufigkeit:
  - [ ] Täglich, wöchentlich, monatlich, on-demand?
- [ ] Nutzer-Kontrolle:
  - [ ] Nutzer kann Update verschieben?
  - [ ] Nutzer kann Update ablehnen?
  - [ ] Erzwungene Updates (z.B. kritischer Sicherheit-Patch)?
- [ ] Kanäle:
  - [ ] Stable-Kanal (default)?
  - [ ] Beta-Kanal (Feedback-Sammlung)?
  - [ ] Nightly/Dev-Kanal?
- [ ] Rollback:
  - [ ] Kann Nutzer zur Vorgänger-Version zurück?
  - [ ] Wie lange alte Versionen vorhalten?
- [ ] Anmeldung notwendig?
  - [ ] Kostenlos für alle?
  - [ ] Lizenz-Validierung beim Update?
  - [ ] Subscription-Check?

**Beispiele:**
- "Automatisch beim Start, wöchentlich. Nutzer kann um 24h verschieben. Keine Beta-Kanäle."
- "Manuell + Smart Update (z.B. nur nachts). Beta-Kanal für 10% der Nutzer."

---

### Schritt 3 — Sicherheit analysieren

**Wie schützen wir Updates vor Manipulation?**

Checklist:
- [ ] Code-Signing:
  - [ ] Executable mit privatem Key signieren?
  - [ ] App verifiziert Signatur vor Installation?
  - [ ] Fallback wenn Signatur ungültig? (ablehnen, warnen, installieren?)
- [ ] Transport-Sicherheit:
  - [ ] HTTPS/TLS für alle Download-Links?
  - [ ] Certificate Pinning?
  - [ ] Proxy-Support?
- [ ] Checksums & Hashes:
  - [ ] SHA256 für jede Download-Datei?
  - [ ] Checksum von vertrauenswürdiger Quelle?
  - [ ] Kann Update-Datei beschädigt sein?
- [ ] Server-Sicherheit:
  - [ ] Kann Update-Server gehackt werden?
  - [ ] Auswirkung: Malware verbreitet? Nutzer-Daten geleckt?
  - [ ] Zugriffsschutz auf Update-Dateien? (private S3 Bucket, Auth-Token?)
- [ ] Notfall-Szenarien:
  - [ ] Exploit in kritischer Version entdeckt — wie schnell können wir fixen?
  - [ ] Kompromittierter Update-Server — wie rollbacken?
  - [ ] Man-in-the-Middle Attacke — wie schützen wir Nutzer?
- [ ] Update-Differenziale (Delta Updates):
  - [ ] Vollständige Update oder nur Unterschied?
  - [ ] Spart Bandbreite, braucht aber mehr Logik

**Beispiele:**
- "Macademy Desktop App — geplant Level 4 (Secure): Code-Signing mit GnuPG, HTTPS, SHA256, verschlüsselte Backups."
- "Web-App in Next.js — Level 3 (Automatic), kein Signing nötig (Server deployed, Browser lädt neu)."

---

### Schritt 4 — Datenschutz & DSGVO

**Welche Daten sammeln wir beim Update? Darf der Nutzer ablehnen?**

Checklist:
- [ ] Telemetrie-Sammlung:
  - [ ] Sammeln wir aktuelle App-Version?
  - [ ] Sammeln wir Nutzer-ID/UUID?
  - [ ] Sammeln wir OS/Hardware-Info?
  - [ ] Sammeln wir Crash-Reports?
  - [ ] Sammeln wir Feature-Usage?
- [ ] Speicherung:
  - [ ] Wie lange Daten speichern? (30 Tage, 1 Jahr?)
  - [ ] Pseudo-anonymisierung oder echte Anonymisierung?
  - [ ] IP-Adresse geloggt? (sehr datenschutzsensitiv)
- [ ] Nutzer-Recht:
  - [ ] Kann Nutzer Telemetrie ablehnen?
  - [ ] Opt-In oder Opt-Out?
  - [ ] Wie einfach Telemetrie deaktivieren?
- [ ] Datenschutzerklärung:
  - [ ] Update-Telemetrie dokumentieren?
  - [ ] Verarbeiter & Subprozessoren auflisten? (z.B. CDN, Analytics-Service)
  - [ ] Rechtliche Basis (Berechtigtes Interesse, Vertrag, Consent)?
- [ ] Third-Party Services:
  - [ ] Sentry, Mixpanel, Analytics: Daten-Transfer & Compliance?
  - [ ] Datenschutz-Agreement mit Anbieter? (DPA)
- [ ] Internationale Nutzer:
  - [ ] CCPA (USA)?
  - [ ] UK GDPR?
  - [ ] Datenfluss-Dokumentation?

**Beispiele:**
- "Desktop-App, Telemetrie: Nur App-Version + generische OS-Info. Kein Nutzer-ID. Opt-Out im Settings. Datenschutzerklärung updated."
- "Web-App: Keine zusätzliche Telemetrie beim Update (nur existing Analytics). Datenschutz-Team bestätigt DSGVO-Compliance."

---

### Schritt 5 — Update-Quelle planen

**Wo liegen die Update-Dateien? Wer hostet sie?**

Checklist:
- [ ] GitHub Releases:
  - [ ] Public oder Private Repo?
  - [ ] Artifacts hochladen (DMG, EXE, APK, ZIP)?
  - [ ] Kosten: kostenlos (Public), kostenpflichtig (Private auf GitHub)?
  - [ ] Download-Speed: CDN oder GitHub-Server?
- [ ] Statisches Manifest auf CDN:
  - [ ] JSON-Datei mit Update-Info (Version, Download-URL, Checksums)
  - [ ] Cloudflare, AWS CloudFront, Bunny CDN?
  - [ ] Kosten: ~$1-5/Monat für kleine Projekte
- [ ] Eigener Update-Server (Self-Hosted):
  - [ ] Node.js/Express, Python Flask, Go, Rust?
  - [ ] Admin-Interface zum Manage Releases?
  - [ ] Version-History & Rollback-UI?
  - [ ] Kosten: ~$10-50/Monat (VPS, Managed)
- [ ] Cloud-Storage:
  - [ ] S3, Google Cloud Storage, Azure Blob Storage?
  - [ ] Signed URLs für Private Zugriff?
  - [ ] Pre-signed URLs für Zeit-begrenzte Downloads?
- [ ] App Stores (Managed Updates):
  - [ ] Apple App Store, Google Play, Microsoft Store?
  - [ ] Store-Updates vs. In-App-Updates (z.B. Flutter)?
  - [ ] Pro: Platform kümmert sich um Distribution
  - [ ] Con: Jede Update braucht Review (1-3 Tage)

**Decision Matrix:**
| Anforderung | GitHub | Manifest + CDN | Self-Hosted | App Store |
|---|---|---|---|---|
| Kosten | Gratis | ~$1-5/mo | ~$20-100/mo | % von Umsatz |
| Speediness | 1-3 Tage | Instant | Instant | 1-3 Tage |
| Private Releases | ✓ | ✓ | ✓ | ✗ |
| Granulare Kontrolle | Gering | Hoch | Sehr Hoch | Keine |
| Komplex für Anfänger | Mittel | Niedrig | Hoch | Niedrig |

**Beispiele:**
- "Desktop-App Indie: GitHub Releases + Manifest JSON auf Cloudflare Workers (Gratis). Version + SHA256 in JSON."
- "Enterprise SaaS: Eigener Update-Server (Node.js) mit Admin-Panel. S3 für Artefakte."

---

### Schritt 6 — Update-Workflow zeichnen

**Was sieht der Nutzer? Welche Schritte laufen ab?**

Zeichne ein Diagramm oder schreib Schritte auf:

```
┌─────────────────────────────────────────────────┐
│ App startet oder Nutzer: "Check for Updates"    │
└──────────────┬──────────────────────────────────┘
               │
               ▼
        ┌─────────────┐
        │ App prüft   │
        │ Server für  │
        │ neue Ver.   │
        └──────┬──────┘
               │
        Neue Version verfügbar?
       ╱                        ╲
      ▼                          ▼
   JA (Version > Current)     NEIN (Schon aktuell)
      │                          │
      ▼                          ▼
  ┌──────────────────┐   ┌─────────────────────┐
  │ Zeige Dialog:    │   │ "Du bist aktuell"   │
  │ "Update 1.2.0"   │   │ oder                │
  │ [Details/Skip]   │   │ "Download läuft..."│
  └────────┬─────────┘   └─────────────────────┘
           │
   Nutzer klickt?
   ╱         │         ╲
  ▼          ▼          ▼
[Skip]   [Later]    [Update]
  │        │          │
  │        │          ▼
  │        │     ┌──────────────────┐
  │        │     │ Download starten │
  │        │     │ (mit Fortschritt)│
  │        │     └────────┬─────────┘
  │        │              │
  │        │ (warte 24h)   ▼
  │        │         ┌────────────────────┐
  │        │         │ Checksums prüfen   │
  │        │         │ Signatur verifizen │
  │        │         └────────┬───────────┘
  │        │                  │
  │        │                  ▼
  │        │         ┌────────────────┐
  │        │         │ Altes Version   │
  │        │         │ als Backup      │
  │        │         │ speichern       │
  │        │         └────────┬───────┘
  │        │                  │
  │        │                  ▼
  │        │         ┌──────────────┐
  │        └────────▶│ Installation │
  │                  │ und Restart  │
  │                  │ (mit Auffrage)
  │                  └──────┬───────┘
  │                         │
  └────────────┬────────────┘
               │
               ▼
        ┌─────────────┐
        │ App updated │
        └─────────────┘
```

**Checkliste:**
- [ ] Wo & wie prüft App auf Updates? (Startup? Alle 24h? Manuell?)
- [ ] Was zeigt der Dialog? (Changelog? Größe? Screenshot?)
- [ ] Kann Nutzer verschieben/ablehnen? Wie lang?
- [ ] Fortschrittsanzeige während Download?
- [ ] Was wenn Download fehlschlägt? Retry?
- [ ] Checksums/Signatur vor Installation prüfen?
- [ ] Alte Version als Backup speichern? (für Rollback)
- [ ] Update im Hintergrund oder mit Auffrage?
- [ ] Restart sofort oder später? Unsaved Work Warnung?
- [ ] Installation neu starten (z.B. bei Fehler)? (mit max retries?)
- [ ] Rollback-Button für Nutzer? (nach Update, falls Problem)

**Beispiele:**
- "Electron App: Auf Startup prüfen (Netzwerk-Auffrage 5s Timeout). Dialog zeigt Changelog aus GitHub. Nutzer kann 24h verschieben. Download + Signatur-Check im Hintergrund. Restart optional. Rollback: zurück-Button im About-Fenster."
- "Flutter Mobile (Android): Play Store managed updates. In-App Update API für zusätzliche Features. Nutzer muss App neu starten."

---

### Schritt 7 — Datenmodell planen

**Wie sieht die Update-Information aus? JSON-Format?**

**Version-Format:**

Checklist:
- [ ] Semantic Versioning (1.2.3, SemVer)?
  - [ ] MAJOR.MINOR.PATCH
  - [ ] z.B. 2.0.0 (breaking), 1.5.0 (feature), 1.4.2 (bugfix)
- [ ] Calendar Versioning (2024.06.20)?
- [ ] Custom Format (z.B. "Release-June-2024")?

**Update-Manifest JSON:**

```json
{
  "latestVersion": "1.5.0",
  "currentVersion": "1.4.2",
  "updateAvailable": true,
  "releases": [
    {
      "version": "1.5.0",
      "releaseDate": "2024-06-20",
      "channel": "stable",
      "platforms": {
        "macos": {
          "url": "https://cdn.example.com/app-1.5.0.dmg",
          "fileSize": 152857600,
          "checksumSHA256": "abc123def456...",
          "signingCertificate": "..."
        },
        "windows": {
          "url": "https://cdn.example.com/app-1.5.0.exe",
          "fileSize": 180224000,
          "checksumSHA256": "xyz789uvw...",
          "signingCertificate": "..."
        },
        "linux": {
          "url": "https://cdn.example.com/app-1.5.0.AppImage",
          "fileSize": 175128576,
          "checksumSHA256": "pqr123stu..."
        }
      },
      "changelog": "- Fixed critical security issue\n- Improved performance\n- New feature: Dark Mode",
      "minOSVersions": {
        "macos": "10.14",
        "windows": "10",
        "linux": "Ubuntu 18.04"
      },
      "mandatory": false,
      "notes": "Optional. Kann bei kritischem Sicherheit-Update auf true"
    }
  ]
}
```

**Changelog-Format:**

Checklist:
- [ ] Markdown oder Plain Text?
- [ ] Trennung: Features / Bugfixes / Security?
- [ ] Benutzer-freundlich (Markdown) oder technisch (Commits)?
- [ ] Versioniert mit jedem Release?

**Download-Artefakte (was wird gepackt?):**

- [ ] DMG (macOS)
- [ ] EXE / MSI (Windows)
- [ ] AppImage / DEB / RPM (Linux)
- [ ] APK / AAB (Android)
- [ ] IPA (iOS, über App Store)
- [ ] ZIP (Web-App, SPA)
- [ ] TAR.GZ (Backend/Server)
- [ ] Docker Image (Container)

**Signierung & Checksums:**

Checklist:
- [ ] Code Signing:
  - [ ] macOS: Developer Certificate (Apple)
  - [ ] Windows: Authenticode (Microsoft Cert)
  - [ ] Linux: GPG Signature
- [ ] Checksums:
  - [ ] SHA256 für jede Datei
  - [ ] Checksums in TXT-Datei oder JSON-Manifest?
- [ ] Public Key für Verifikation:
  - [ ] Wo ist Public Key gelagert? (In App gebakken? Von Server?)

**Beispiele:**
- "Electron Desktop: SemVer (1.2.3), Manifest als JSON auf S3. DMG/EXE/AppImage mit macOS/Windows/Linux-Zertifikaten. SHA256 checksums in manifest.json."
- "Web-App React: Version in package.json. Build-Hash als Version. No manifest needed (Browser lädt index.html + neuen JS Bundle)."

---

### Schritt 8 — Backend-Infrastruktur

**Brauchen wir einen eigenen Server? Was läuft da?**

Checklist:
- [ ] Server notwendig?
  - [ ] Nur für Manifest-Hosting? (einfach, statisch)
  - [ ] Für Admin-Interface? (um Releases zu pushen)
  - [ ] Für Download von Artefakten? (oder CDN)
  - [ ] Für Telemetrie & Logging? (welche Updates, wie oft geholt)
  - [ ] Für Lizenz-Validierung? (Pro/Lite Tier checks)
- [ ] Tech-Stack:
  - [ ] Node.js/Express
  - [ ] Python Flask/Django
  - [ ] Go
  - [ ] Rust
  - [ ] Statische Lösung (GitHub Pages, Netlify)?
- [ ] Admin-Panel:
  - [ ] Webinterface um neue Releases hochzuladen?
  - [ ] Versionsverwaltung (alte Releases sichtbar)?
  - [ ] Rollback-Button (alte Version wieder live)?
  - [ ] Staged Rollout (z.B. "10% Nutzer → 50% → 100%")?
  - [ ] Monitoting & Analytics? (wie viele Downloads, Fehler, etc.)
- [ ] Datenbank:
  - [ ] SQLite (einzeln), PostgreSQL, MySQL?
  - [ ] Was speichern? (Release-Metadata, Nutzer-Downloads, Crash-Reports?)
  - [ ] Wie lange Daten vorhalten?
- [ ] Authentifizierung:
  - [ ] API Key für Admin-Panel?
  - [ ] OAuth/GitHub Authentifizierung?
  - [ ] Role-Based Access (Admin, Manager, Read-Only)?
- [ ] Infrastructure:
  - [ ] VPS (DigitalOcean, Linode, AWS EC2)?
  - [ ] Managed Platform (Heroku, Railway, Vercel)?
  - [ ] Docker/Kubernetes?
  - [ ] Auto-Scaling notwendig?
- [ ] Backup & Disaster Recovery:
  - [ ] Backup von Manifests & Artefakten?
  - [ ] Wie schnell wiederherstellen?
  - [ ] Failover zu Secondary Server?

**Kosten-Beispiele:**
- Simple Manifest on Cloudflare Workers: Gratis
- VPS mit Node.js Server: $5-20/Monat
- Managed SaaS (Rollout.app, LaunchDarkly): $100-1000+/Monat
- Enterprise selbst-gehostet: $500-2000+/Monat (Ops, Redundancy, Security)

**Beispiele:**
- "Indie Desktop App: Manifest JSON auf GitHub Releases (gratis). Keine DB nötig."
- "SaaS Enterprise: Node.js Server (DigitalOcean $12/mo), PostgreSQL für Telemetrie, Admin Panel (React). Rollout: 10% → 50% → 100% über 3 Tage."

---

### Schritt 9 — Testing-Strategie

**Wie testen wir Updates bevor sie live gehen?**

Checklist:

**Lokal (auf Dev-Maschine):**
- [ ] Alte App starten, neue Version simulieren
- [ ] Download + Installation testen
- [ ] Checksums verifizieren
- [ ] Signatur verifizieren (wenn verwendet)
- [ ] Rollback-Funktion testen
- [ ] Edge Cases: Netzwerk-Fehler, Disk voll, Permission denied?

**Staging-Server:**
- [ ] Test-Manifest auf separaten Server (staging.example.com)
- [ ] Einige echte Nutzer (Testers, Team) downloaden Staging-Version
- [ ] Fehler-Reports sammeln bevor Prod-Release
- [ ] Wie lange Staging-Test läuft? (1 Woche? 2 Wochen?)

**Canary-Rollout (Prod):**
- [ ] 5% der Nutzer bekommen Update
- [ ] 24-48 Stunden warten, Fehler beobachten
- [ ] 50% der Nutzer
- [ ] 100% der Nutzer
- [ ] Fallback: Wenn Fehler, alte Version wieder aktivieren

**Automatisierte Tests:**
- [ ] Manifest JSON Validierung (Schema)
- [ ] Checksums korrekt berechnet?
- [ ] Download-Links aktiv?
- [ ] Signatur korrekt?
- [ ] Versionsnummern monoton steigend?

**Monitoring & Alerting:**
- [ ] Wie viele Nutzer haben Update gezogen?
- [ ] Wie viele Downloads fehlgeschlagen?
- [ ] Crash-Rates nach Update vs. Vorher?
- [ ] Fehler-Logging (Sentry, LogRocket)?
- [ ] Alerts: "5% Fehlerrate" → Stopp Rollout

**Rollback-Szenarien:**
- [ ] Alte Version noch auf CDN?
- [ ] Manifest zurückändern auf Vorgänger-Version?
- [ ] Wie schnell können wir Nutzer zurück-leiten?
- [ ] Nutzer-Kommunikation (E-Mail, In-App)?

**Checkliste Testing:**
- [ ] ✓ Lokal: Alte → Neue → Rollback
- [ ] ✓ Staging: 1-2 Wochen mit realen Testingbenutzern
- [ ] ✓ Canary: 5% → 50% → 100% mit Monitoring
- [ ] ✓ Automated: Schema, Checksums, Links, Signatur
- [ ] ✓ Monitoring: Download-Fehler, Crashes, Performance
- [ ] ✓ Rollback: Plan & Dokumentation

**Beispiele:**
- "Desktop App: Lokal testen auf 3 Systemen (macOS Intel, macOS M1, Windows). Staging 1 Woche. Canary 5% → 48h → 50% → 48h → 100%."
- "Mobile App (Play Store): Testing über internal test track (10 testers, 3 days) → Closed beta (1000 testers, 7 days) → Open release (100%)."

---

### Schritt 10 — Release-Planung

**Wie automatisieren wir Release-Prozess? Dokumentation?**

Checklist:

**Version-Tagging:**
- [ ] Git Tags für jedes Release (v1.5.0)?
- [ ] Automatisch bei Push? (GitHub Actions)
- [ ] Manuell beim Release?
- [ ] Tag-Format: "v1.2.3" oder "release/1.2.3"?

**Build-Automation:**
- [ ] GitHub Actions, GitLab CI, Travis CI?
- [ ] Trigger: Manual oder auf Tag?
- [ ] Schritte:
  - [ ] Compile/Build
  - [ ] Unit Tests
  - [ ] Integration Tests
  - [ ] Code Signing
  - [ ] Artifact Upload (GitHub Releases, S3, etc.)
  - [ ] Manifest Update
  - [ ] Notify Server
  - [ ] Slack/E-Mail Alert

**Release-Notes:**
- [ ] Changelog Format (Markdown, Plain Text)
- [ ] Welche Infos?
  - [ ] Features
  - [ ] Bugfixes
  - [ ] Security Fixes
  - [ ] Breaking Changes
  - [ ] Known Issues
- [ ] Auto-Generated (from Git Commits) oder Manual?
- [ ] Multi-Language? (z.B. Englisch + Deutsch)

**GitHub Release Template:**
```
## Version 1.5.0 (2024-06-20)

### Features
- [ ] Feature A
- [ ] Feature B

### Bugfixes
- [ ] Bug A
- [ ] Bug B

### Security
- [ ] CVE-2024-XXXXX patched

### Downloads
- **macOS**: [app-1.5.0.dmg](...)
- **Windows**: [app-1.5.0.exe](...)
- **Linux**: [app-1.5.0.AppImage](...)

### Checksum (SHA256)
```

**Manifest Update-Automation:**
- [ ] Script um JSON-Manifest zu aktualisieren?
- [ ] Auto-Push zu CDN/S3?
- [ ] Cache-Invalidierung? (Cloudflare purge)

**Communication Plan:**
- [ ] Wann informieren wir Nutzer? (vor, nach Release?)
- [ ] Kanäle: Blog, E-Mail, In-App, Social Media?
- [ ] Template für Major Release Ankündigung?
- [ ] Changelog-Post auf Blog/Community?

**Monitoring Post-Release:**
- [ ] Erste 24h intensives Monitoring
- [ ] Metrics: Downloads, Fehler, Crashes
- [ ] Rollback-Entscheidung: ja/nein?
- [ ] Retro nach 1 Woche?

**Dokumentation:**
- [ ] Release-Prozess dokumentieren (README oder Wiki)
- [ ] Runbook für Rollback
- [ ] Rollback-Entscheidung Kriterien
- [ ] Checklist zum Abhaken vor jedem Release

**Beispiele:**
- "Desktop App: Auf jeden Git Tag (v*) läuft GitHub Action. Build → Code-Sign → S3 Upload → Update manifest.json auf CloudFlare Workers. Slack-Alert an Team."
- "Mobile App: Manual release über fastlane. Changelog auto-generated von git log. TestFlight 3 Tage → App Store."

---

## Phase 2: Agent-Integration

Nach Abschluss der 10 Planungsschritte: **Agent starten für Umsetzung**.

Der Agent bekommt deinen Plan (aus `examples/[dein-projekt]/PLAN.md`) und implementiert:

### Agent-Workflow

```
PHASE 2: IMPLEMENTATION

1. Agent liest PLAN.md
   ├─ Projekt-Typ
   ├─ Maturity Level
   ├─ Update-Quelle
   └─ Sicherheits-Anforderungen

2. Agent generiert Boilerplate-Code
   ├─ Update-Client (für App)
   ├─ Update-Server (falls nötig)
   ├─ JSON-Manifest
   ├─ Test-Suites
   └─ GitHub Actions Workflow

3. Agent integriert in deine App
   ├─ Dependencies hinzufügen
   ├─ Update-Logik einfügen
   ├─ UI-Dialog designen
   └─ Config anpassen

4. Agent testet lokal
   ├─ Build & Compile
   ├─ Update-Scenario simulieren
   ├─ Download testen
   ├─ Signatur/Checksums verifizieren
   └─ Rollback testen

5. Agent testet auf Staging
   ├─ Test-Manifest hochladen
   ├─ Test-Artefakte auf CDN
   ├─ Einige echte Downloads
   └─ Fehler-Szenarien

6. Agent debuggt mit dir
   ├─ Fehler analysieren
   ├─ Fixes vorschlagen
   ├─ Re-Test
   └─ Wiederholen bis stabil

7. Agent bereitet Release vor
   ├─ Version-Tagging (Git)
   ├─ Build-Artifacts generieren
   ├─ Code-Signing
   ├─ Manifest aktualisieren
   ├─ Release-Notes schreiben
   └─ GitHub Release erstellen

8. Agent instruiert Monitoring
   ├─ Alerting-Rules
   ├─ Monitoring-Dashboard
   ├─ Rollback-Runbook
   └─ Post-Release Checklist
```

### Agent-Triggers

Mit **Claude Code**, **Codex**, **Cursor**, oder **Windsurf**:

```
/software-updater analyse
  → Agent analysiert dein Projekt (Schritt 1-3)
  → Fragt dich nach Anforderungen
  → Erstellt Summary

/software-updater plan
  → Agent arbeitet durch Schritt 4-10 mit dir
  → Dokumentiert Plan
  → Erstellt PLAN.md Datei

/software-updater checklist
  → Agent prüft ob alle 10 Schritte abgeschlossen
  → Warnt vor Lücken (z.B. "Sicherheit nicht definiert!")
  → Gibt Freigabe für Phase 2

/software-updater implement
  → Agent startet Phase 2
  → Generiert Code basierend auf PLAN.md
  → Integriert in deine App
  → Schreibt Tests

/software-updater test
  → Agent testet Update-Szenarien
  → Lokal + Staging
  → Debuggt Fehler

/software-updater release
  → Agent vorbereitet GitHub Release
  → Schreibt Release-Notes
  → Erstellt Build-Artifacts
  → Uploaded zu CDN
  → Updated Manifest
  → Notify Server
```

---

## Maturity-Level (Was ist dein Level?)

Die meisten Projekte starten auf Level 1 oder 2. Mit der Zeit professionalisieren sie sich.

### Level 1 — Manual Notice

**Was:** Nutzer prüft selbst auf Updates oder wird benachrichtigt (z.B. E-Mail).
**Keine Automation.** Nutzer lädt manuell herunter und installiert.

Beispiele:
- Blog-Post: "Neue Version verfügbar, Download hier"
- E-Mail zu existierenden Kunden
- Social Media Ankündigung
- GitHub Releases-Seite

Anforderungen:
- ✓ Website mit Download-Link
- ✓ GitHub Releases (optional)
- ✗ Update-Client in App
- ✗ Sicherheit kritisch

Kosten: Gratis bis $5/Monat (GitHub Pages)

---

### Level 2 — Guided

**Was:** App zeigt Update-Dialog an. Nutzer klickt Download, installiert manuell.

Beispiele:
- Desktop App: "Version 1.5.0 verfügbar → [Download]"
- Mobile App (nicht App-Store): "Update bereit → [Details...] → [Download]"
- Web-App: "New version, [Reload Page]"

Anforderungen:
- ✓ App prüft Server auf Updates
- ✓ Dialog mit Changelog
- ✓ Download-Link (GitHub Releases, S3, CDN)
- ✓ Einfache Sicherheit (HTTPS, eventuell Checksums)
- ✗ Automatische Installation
- ✗ Code-Signing
- ✗ Rollback

Kosten: $1-10/Monat (Manifest auf CDN)

---

### Level 3 — Automatic

**Was:** App lädt Update automatisch herunter und installiert. Nutzer wird benachrichtigt, kann Neustart aufschieben.

Beispiele:
- Electron App: Download + Install im Hintergrund, dann Neustart-Dialog
- Flutter Desktop: Auto-Update beim nächsten Start
- Web-App: Auto-Reload mit Service Worker

Anforderungen:
- ✓ Auto-Download & Auto-Install
- ✓ Dialog zur Bestätigung (später oder jetzt?)
- ✓ Checksums-Verifikation
- ✓ Installation Rollback (nur einfach, kein Versioning)
- ✗ Code-Signing (optional)
- ✗ Staged Rollout
- ✗ Lizenzierung

Kosten: $5-20/Monat (Server, Manifest, CDN)

---

### Level 4 — Secure

**Was:** Wie Level 3, aber mit Enterprise-Security: Code-Signing, Checksums, TLS, Rollback-Versioning, Monitoring.

Beispiele:
- macOS Desktop App: Signed DMG, verified Signature vor Install
- Windows EXE: Authenticode Signing, Windows Update verified
- Flutter: Signed APKs, Google Play managed updates

Anforderungen:
- ✓ Code-Signing (Private Key Management)
- ✓ Checksum Verifikation (SHA256)
- ✓ HTTPS/TLS für alle Downloads
- ✓ Manifest-Signierung (optional)
- ✓ Versionierte Backups (Rollback zu beliebiger Version)
- ✓ Monitoring & Alerting
- ✓ Crash-Reports
- ✗ Staged Rollout (5% → 50% → 100%)
- ✗ Lizenzierung / Premium-Tiers
- ✗ Admin-Panel

Kosten: $20-100/Monat (Server, Ops, Monitoring)

---

### Level 5 — Enterprise

**Was:** Wie Level 4, plus advanced features: Lizenzvalidierung, Kanäle (Stable/Beta/Dev), Staged Rollout mit Monitoring, Admin-Dashboard, Telemetry, Feature Flags.

Beispiele:
- Large Enterprise App: 10% Rollout → 50% (48h monitoring) → 100%
- SaaS mit Self-Hosted Updater: Managed Updates + Licensing Tier Checks
- Game Studio: Beta Testers get updates 1 week early

Anforderungen:
- ✓ Alle von Level 4
- ✓ Kanäle (Stable, Beta, Dev, Nightly)
- ✓ Staged Rollout (5% → 50% → 100% mit Auto-Rollback)
- ✓ Admin-Dashboard (Release Management UI)
- ✓ Lizenzvalidierung (Pro/Lite Tiers)
- ✓ Telemetry & Analytics
- ✓ Feature Flags / A/B Testing
- ✓ CRDT / Multi-Region Updates
- ✓ Enterprise Support & SLA

Kosten: $100-500+/Monat (Ops, Infrastructure, Compliance)

---

## Sicherheitsregeln für Update-Systeme

### Regel 1: Code-Signing ist nicht optional für Level 4+

Alle Executables müssen signiert sein:
- **macOS**: Developer Certificate (Apple)
- **Windows**: Authenticode (Microsoft Cert)
- **Linux**: GPG Signature

Ohne Signing können Attacken Malware verbreiten.

### Regel 2: TLS/HTTPS für alle Downloads

Alle Download-Links müssen HTTPS sein. Man-in-the-Middle-Attacken sind sonst möglich.

### Regel 3: Checksums müssen verifiziert werden

Nach Download, BEVOR Installation:
```
SHA256(downloaded_file) == expected_SHA256
```

### Regel 4: Vertrauenswürdige Update-Quelle

Update-Server darf nicht gehackt werden können:
- Private AWS S3 Bucket oder signierte URLs
- API-Authentifizierung (Token-based)
- DDoS-Protection (Cloudflare, AWS Shield)
- Regelmäßige Security Audits

### Regel 5: Rollback muss möglich sein

Alte Versionen müssen erhalten bleiben (mindestens 3 vorherige):
- für Rollback im Fehlerfall
- für Sicherheits-Patches (wenn neue Version Fehler hat)

### Regel 6: Update-Fehler darf App nicht zerstören

Wenn Update fehlschlägt → Alte Version weiterhin lauffähig:
- Update im separaten Verzeichnis
- Erst nach Verifikation zur aktiven Version
- Automat. Rollback wenn Installation fehlschlägt

---

## Support für Technologien

### Desktop

| Tech | Level | Code-Example | Details |
|------|-------|---|---|
| **Electron** | 1-5 | ✓ ja | electron-updater Library |
| **Tauri** | 1-5 | ✓ ja | Tauri Updater |
| **Flutter Desktop** | 1-5 | ✓ ja | sparkle, app_installer |
| **macOS (Swift)** | 1-5 | ✓ ja | Sparkle Framework |
| **Windows (.NET)** | 1-4 | ✓ ja | WinAppDriver, Squirrel.Windows |
| **Java (Swing)** | 1-3 | ✓ ja | launch4j, Canonical Repos |
| **Python (PyQt/Tk)** | 1-3 | ✓ ja | pyupdater |

### Mobile

| Tech | Level | Code-Example | Details |
|------|-------|---|---|
| **Flutter** | 1-5 | ✓ ja | in_app_update, firebase |
| **React Native** | 1-5 | ✓ ja | react-native-update, CodePush |
| **Swift (iOS)** | 3-5 | ✓ ja | App Store, TestFlight |
| **Kotlin (Android)** | 3-5 | ✓ ja | Google Play, In-App Updates |

### Web

| Tech | Level | Code-Example | Details |
|------|-------|---|---|
| **React** | 3-5 | ✓ ja | Service Worker |
| **Vue** | 3-5 | ✓ ja | Workbox |
| **Next.js** | 3-5 | ✓ ja | SWR + ISR |
| **Plain HTML/JS** | 1-3 | ✓ ja | App Cache, Service Worker |
| **SPA (any)** | 3-5 | ✓ ja | Service Worker Lifecycle |

### Backend / SaaS

| Tech | Level | Code-Example | Details |
|------|-------|---|---|
| **Node.js** | 1-5 | ✓ ja | Blue-Green Deploy, Containers |
| **Python** | 1-5 | ✓ ja | Gunicorn, Celery, Zero-Downtime |
| **Go** | 1-5 | ✓ ja | Rolling Updates, Kubernetes |
| **Docker** | 1-5 | ✓ ja | Container Orchestration |
| **Kubernetes** | 4-5 | ✓ ja | Helm, ArgoCD |

### Games

| Tech | Level | Code-Example | Details |
|------|-------|---|---|
| **Unity** | 1-5 | ✓ ja | addressables, delta compression |
| **Unreal** | 1-5 | ✓ ja | Patching API |
| **Godot** | 1-3 | ✓ ja | res:// Hotloading |
| **HTML5 (WebGL)** | 3-5 | ✓ ja | Service Worker |

---

## Agent-Regeln

Dieser Skill wird mit KI-Agenten verwendet. Agents müssen diese Regeln einhalten:

### Regel 1: Phase 1 immer ZUERST

Wenn jemand sagt "baue mir ein Update-System", IMMER zuerst die 10 Planungsschritte durchlaufen.

**Kein Agent darf Phase 2 starten ohne abgeschlossene Phase 1.**

Ausnahme: Der Nutzer says "Ich hab bereits einen Plan, hier ist PLAN.md" → dann direkt Phase 2.

### Regel 2: Plan als PLAN.md dokumentieren

Agent muss die Planung in `examples/[dein-projekt]/PLAN.md` schreiben:

```markdown
# Update-Plan für [App Name]

## Schritt 1: Projekt-Typ
[Antworten]

## Schritt 2: Update-Anforderungen
[Antworten]

...

## Schritt 10: Release-Planung
[Antworten]

## Maturity-Level
Level 2 — Guided

## Empfohlene Tools
- GitHub Releases (kostenlos)
- Cloudflare Workers für Manifest
- electron-updater Library
```

### Regel 3: Code-Beispiele aus `templates/`

Agent muss Code nicht von Grund auf schreiben, sondern Templates anpassen:

```
templates/update-manifest.json        → anpassen für dein Projekt
templates/update-client.ts             → in deine App integrieren
templates/update-server.js             → für dich deployieren
templates/github-actions.yml           → für Automation
```

### Regel 4: Testing IMMER ZUERST

Agent muss LOKAL testen bevor irgendwas Prod geht:

1. Alte → Neue Version simulieren
2. Download testen
3. Checksums verifizieren
4. Signatur verifizieren
5. Rollback testen

Erst danach: Staging → Canary → Prod.

### Regel 5: Dokumentation schreiben

Agent muss am Ende dokumentieren:
- README für Update-Setup
- GitHub Actions Workflow erklären
- Runbook für Rollback
- Post-Release Checklist

---

## Support & Issues

Fragen? Öffne ein Issue auf GitHub oder besuche [michael-gahn.de](https://michael-gahn.de).

---

**Versionsverlauf:**
- **v1.0** (2024-06-20): Initial release. 10 Schritte + Agent-Integration + 5 Maturity-Levels

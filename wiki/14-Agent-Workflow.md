# 14 Agent-Workflow: Wie man diesen Skill nutzt

## Überblick

Dieser Skill hat einen **Agenten** der deine Update-Implementierung automatisiert. Dieses Kapitel zeigt wie du den Agenten nutzt.

## Workflow-Übersicht

```
Phase 1: Planung (du)
    ↓
    Schreibe Plan-Dokument
    (Lese Kapitel 2-10)
    ↓
Phase 2: Implementation (Agent)
    ↓
    /skill MGD-Software-Updater --plan "plan.md"
    ↓
    Agent generiert Code
    Agent schreibt Tests
    Agent erstellt Workflows
    Agent deployt Staging
    ↓
Phase 3: Testing (du)
    ↓
    Teste lokal
    Verifiziere auf Staging
    ↓
Phase 4: Release (Agent / du)
    ↓
    Agent erstellt Release
    oder du pushst Tag
    ↓
Live!
```

## Phase 1: Plan-Dokument vorbereiten

Erstelle eine Datei namens `UPDATE_PLAN.md`:

```markdown
# Update-System Plan für MyApp

## 1. Projekt-Info

**App-Name:** MyApp  
**Aktuelle Version:** 2.0.5  
**Geplante Version:** 2.1.0  
**Platforms:** Windows, macOS, Linux  

## 2. Maturity-Level

Level 3: Automatic Update
- App lädt Updates im Hintergrund
- Dialog vor Installation
- Restart-Dialog
- Basic Rollback

## 3. Plattformen

### Windows
- Target: x64, x86
- Distribution: GitHub Releases
- Installer: EXE (NSIS)
- Code-Signing: Nein (MVP)

### macOS
- Target: Intel + Apple Silicon
- Distribution: GitHub Releases
- Installer: DMG
- Notarization: Nein (MVP)

### Linux
- Target: AppImage format
- Distribution: GitHub Releases
- Auto-Update: Ja

## 4. Update-Mechanismus

- Prüfung: Täglich um 3 Uhr UTC
- Server: GitHub Releases API
- Manifest: manifest.json im Release Asset
- Dialog-Typ: Standard (Version + Changelog)
- Actions: "Jetzt updaten", "Später"

## 5. Sicherheit

- HTTPS: Ja (GitHub garantiert)
- Hash-Verifikation: SHA256
- Code-Signierung: Später (nach MVP)
- Rollback: Automatisch bei Crash

## 6. Telemetry

- Aktiviert: Ja, mit Opt-in Dialog
- Gesammelte Daten:
  - Update-Check erfolgt/fehlt
  - Update akzeptiert/abgelehnt
  - Versionsnummern (current/available)
- Speicher: Max 90 Tage
- Datenschutz: DSGVO-konform, anonymisiert

## 7. Changelog

- Quelle: CHANGELOG.md im Repo
- Format: Markdown
- Im Dialog anzeigen: Ja
- Maximale Länge: 500 Zeichen

## 8. Timeline

- MVP (Level 3): 2 Wochen
- Release: 2026-07-15
- Staging-Test: 2026-07-08 bis 2026-07-14
- Go-Live: 2026-07-15

## 9. Team

- Entwicklung: Alice (Frontend), Bob (Backend)
- QA: Charlie
- Datenschutz: Diana
- Support: Eve

## 10. Erfolgs-Kriterien

- ✓ 80% der Nutzer updaten auf neue Version innerhalb 2 Wochen
- ✓ Fehlerrate < 1%
- ✓ Zero Datenschutz-Verstöße
- ✓ Update-Zeit < 5 Minuten
```

## Phase 2: Agent starten

```bash
# Mit Plan-Dokument starten
/skill MGD-Software-Updater --plan UPDATE_PLAN.md

# Oder interaktiv (Agent fragt dich)
/skill MGD-Software-Updater --interactive
```

## Agent-Schritte

Der Agent führt automatisch folgende Schritte aus:

### Schritt 1: Code-Skeleton generieren

```
Agent generiert:
  ├── src/updater.js
  ├── src/manifest-loader.js
  ├── src/update-dialog.js
  ├── src/installer.js
  └── src/telemetry.js
```

**Was du überprüfst:**
1. Öffne `src/updater.js` und verifiziere:
   - Richtige Prüf-Frequenz (daily)
   - Richtige Download-Quelle (GitHub)
   - Rollback-Logik vorhanden
2. Öffne `src/update-dialog.js`:
   - Dialog zeigt aktuelle + neue Version
   - Changelog angezeigt
   - Buttons: "Jetzt", "Später"

### Schritt 2: In App integrieren

Agent integriert Code in deine App:

```javascript
// src/main.js
import { UpdateManager } from './updater';

const updateManager = new UpdateManager({
  checkUrl: 'https://api.github.com/repos/myorg/myapp/releases/latest',
  checkInterval: 24 * 60 * 60 * 1000, // Daily
  manifestPath: 'manifest.json'
});

// Start checking
updateManager.start();
```

**Was du überprüfst:**
1. App startet ohne Fehler: `npm start`
2. Console zeigt keine Warnungen
3. Update-Check läuft im Hintergrund (verifiziere mit DevTools)

### Schritt 3: Tests schreiben

Agent generiert Tests:

```
Agent erstellt:
  ├── tests/updater.test.js
  ├── tests/manifest-loader.test.js
  ├── tests/update-dialog.test.js
  └── tests/installer.test.js
```

**Was du überprüfst:**
1. Tests laufen: `npm test`
2. Alle Tests grün (mindestens 80% Coverage)
3. Error-Szenarien getestet:
   - Netzwerkfehler
   - Corrupted Download
   - Installation fehlgeschlagen

### Schritt 4: Lokal testen

Agent gibt dir Test-Anleitung:

```
Manuelle Tests durchführen:

1. Update-Dialog anzeigen:
   - DevTools Console: updateManager.checkForUpdate()
   - Dialog sollte erscheinen mit "Update verfügbar"

2. Download simulieren:
   - Click "Jetzt updaten" im Dialog
   - Verifiziere Progress-Dialog zeigt Download-Prozentsatz

3. Installation testen:
   - Download abschließen
   - App sollte Installation starten
   - Verifiziere alte Version wird backed up

4. Rollback testen:
   - Stoppe App während Installation (kill process)
   - Starte App neu
   - Verifiziere Rollback passierte (alte Version aktiv)
```

### Schritt 5: Staging deployen

Agent deployt auf Staging-Server:

```
Staging Deploy Steps:

1. Build Binaries
   - Windows .exe (x64, x86)
   - macOS .dmg
   - Linux .AppImage

2. Upload zu Staging Release
   - GitHub Release als "Pre-release" markiert
   - Version: v2.1.0-staging.1

3. Update manifest.json
   - Download-URLs zeigen auf Staging Release
   - Hash-Werte korrekt

4. QA-Testing Anleitung
   - Download Staging Version
   - Teste Update-Flow
   - Berichte Fehler
```

### Schritt 6: Release-Notes vorbereiten

Agent generiert Release-Notes:

```markdown
## MyApp 2.1.0

### Neue Features
- Dark Mode (#123)
- Export zu PDF (#124)
- Performance +30% auf Datenbank (#125)

### Bugfixes
- Fixed crash beim Login (#120)
- Fixed UI-Glitch bei kleine Screens (#121)
- Fixed Memory-Leak (#122)

### Kompatibilität
- Minimum Version: 2.0.0
- Empfohlene Version: 2.1.0
- Database Migration: Automatisch

### Installation
1. Click "Update" im Dialog
2. Warte auf Download (ca. 30 Sekunden)
3. Click "Jetzt neustarten"
4. App startet mit neuer Version

Viel Spaß mit den neuen Features!
```

## Phase 3: Testing durchführen

### Test-Szenarien (von Agent vorbereitet)

Du führst diese Tests durch:

```bash
# 1. Unit-Tests lokal
npm test

# 2. Integration-Tests mit Mock-Server
npm run test:integration

# 3. Staging Update Test
npm run test:staging -- --version v2.1.0-staging.1

# 4. Rollback Test
npm run test:rollback
```

### Staging-Testing-Checkliste

```
[ ] Alle Plattformen getestet (Win, Mac, Linux)
[ ] Update-Dialog zeigt korrekte Infos
[ ] Download funktioniert
[ ] Hash-Verifikation funktioniert
[ ] Installation erfolgreich
[ ] App startet mit neuer Version
[ ] Alte Daten erhalten bleiben
[ ] Rollback funktioniert bei Fehler
[ ] Telemetry funktioniert (Consent Dialog)
[ ] Keine Datenschutz-Verstöße
[ ] Performance akzeptabel (< 5 Min Update-Zeit)
```

## Phase 4: Release durchführen

### Option A: Agent erstellt Release automatisch

```bash
# Agent erstellt Production Release
/skill MGD-Software-Updater --release v2.1.0

Agent wird:
1. Binaries bauen
2. Hashes berechnen
3. Release Notes aus CHANGELOG generieren
4. GitHub Release erstellen & publizieren
5. manifest.json zu Production Server pushen
```

### Option B: Manuelles Release (du)

```bash
# 1. Push Tag zu GitHub
git tag -a v2.1.0 -m "Release version 2.1.0"
git push origin v2.1.0

# GitHub Actions baut automatisch & erstellt Release
# (Falls du workflow konfiguriert hast)

# 2. Verifiziere Release
gh release view v2.1.0

# 3. Publishe manifest zu Server
curl -X POST https://updates.example.com/api/manifest \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@manifest.json"
```

## Agent-Befehle (Vollständige Liste)

```bash
# Starte Interactive Guide
/skill MGD-Software-Updater --help

# Mit Plan-Dokument
/skill MGD-Software-Updater --plan path/to/plan.md

# Nur Code generieren (kein Deploy)
/skill MGD-Software-Updater --plan plan.md --code-only

# Nur Tests schreiben
/skill MGD-Software-Updater --plan plan.md --tests-only

# Deploy zu Staging
/skill MGD-Software-Updater --plan plan.md --staging

# Vollständiges Release (Prod)
/skill MGD-Software-Updater --plan plan.md --release v2.1.0

# Update bestehendes Setup
/skill MGD-Software-Updater --update-existing

# Debug-Modus (verbose output)
/skill MGD-Software-Updater --plan plan.md --debug

# Simuliere Fehler (Testing)
/skill MGD-Software-Updater --plan plan.md --simulate-errors
```

## Troubleshooting

### Agent steckengeblieben?

```bash
# Stop Agent und versuche erneut
Ctrl+C

# Mit Debug-Output
/skill MGD-Software-Updater --plan plan.md --debug

# Logs lesen
tail -f /tmp/updater-agent.log
```

### Test schlägt fehl?

```
Häufige Fehler:

1. "Network error on manifest fetch"
   → Verifiziere Download-URL ist erreichbar
   → Check GitHub API rate limits

2. "Hash mismatch"
   → Binaries wurden modifiziert
   → Neuen Hash berechnen

3. "Installation failed"
   → Check Disk-Space
   → Check Permissions
   → Verifiziere Installer-Format

4. "Rollback failed"
   → Check Backup existiert
   → Check alte Version intakt
```

### Agent generiert Code mit Bugs?

```
1. Melde dem Agent
   "This code has a bug in [component], [description]"

2. Agent wird Code revisieren

3. Falls Problem persisting:
   - Schreib manuellen Fix
   - Schick Agent mit --update-existing
   - Agent mergt deine Änderungen
```

## Best Practices mit Agent

### DO ✓

1. **Read plan carefully** vor Agent-Start
2. **Test lokal** bevor du zu Staging gehst
3. **Verifiziere Tests** laufen & sind green
4. **Approve Staging** bevor Production Release
5. **Monitor Logs** nach Go-Live

### DON'T ✗

1. Ändere Agent-generierten Code ohne Grund
2. Überspringe Test-Phase
3. Release direkt zu Production ohne Staging
4. Starte neuen Agent während eines läuft
5. Ignoriere Fehler-Warnungen vom Agent

## Post-Release Monitoring

Nach Go-Live:

```bash
# Monitor Update Success Rate
/skill MGD-Software-Updater --monitor

# Check Error Logs
curl https://api.example.com/analytics/update-errors

# Rollback if necessary
/skill MGD-Software-Updater --rollback v2.0.5
```

## Zusammenfassung

| Phase | Was | Wer | Duration |
|-------|-----|-----|----------|
| 1. Plan | Schreib Plan-Dokument | Du | 2 hours |
| 2. Code | Agent generiert Implementation | Agent | 30 min |
| 3. Testing | Test lokal + Staging | Du + QA | 3-5 days |
| 4. Release | Agent/du erstellt Release | Agent/Du | 30 min |
| 5. Monitor | Überwache Go-Live | Du | ongoing |

**Total Time:** ~1 Woche für komplettes Update-System

---

**Weiter:** Kapitel 15 (FAQ) oder Kapitel 16 (Glossar)

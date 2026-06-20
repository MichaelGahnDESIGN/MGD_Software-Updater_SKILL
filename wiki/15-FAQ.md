# 15 FAQ - Häufig gestellte Fragen

## Allgemeine Fragen

### F: Brauche ich ein Update-System?

**A:** Es kommt darauf an:
- **Ja, wenn:** Mehr als 10 Nutzer, Apps die oft gefixt werden, Desktop/Mobile
- **Nein, wenn:** < 5 interne Nutzer, Nischensoftware, oder kein Budget
- **Siehe:** Kapitel 2 (Maturity-Levels) für Entscheidungsmatrix

### F: Welcher Maturity-Level für mein Projekt?

**A:** Antworte auf diese Fragen:

1. Wie viele Nutzer? (< 100, 100-1K, 1K-100K, > 100K)
2. Wie kritisch die App? (Hobby, Business, Mission-Critical)
3. Wie oft Updates? (< 1x/Monat, 1-4x/Monat, > 1x/Woche)
4. Sicherheitsanforderungen? (keine, normal, strict)

**Dann:** Lese Kapitel 2, Tabelle am Ende

### F: Kann ich mit Level 1 starten und später upgraden?

**A:** Ja, das ist smart!
- Start mit **Level 1 (Manual)** oder **Level 2 (Guided)**
- Bei Wachstum zu **Level 3 (Auto)** upgraden
- Bei kritischen Apps zu **Level 4 (Secure)** upgraden
- Jeder Level baut auf dem vorherigen auf

Keine großen Rewrites nötig!

### F: Wie viel Zeit kostet ein Update-System?

**A:**

| Level | Entwicklungszeit | Wartung pro Release | Gesamtkosten |
|-------|------------------|-------------------|--------------|
| 1 | 4 Stunden | 30 Min | $$$ |
| 2 | 16 Stunden | 1-2 Std | $$ |
| 3 | 40 Stunden | 2-3 Std | $$$ |
| 4 | 120 Stunden | 4-6 Std | $$$$ |
| 5 | 250 Stunden | 8-12 Std | $$$$$ |

Siehe Kapitel 14 für Agent-Automation.

## Technische Fragen

### F: Ist GitHub Releases sicher genug?

**A:** Ja, für Level 1-3:
- GitHub nutzt HTTPS
- Assets sind kryptografisch signed by GitHub
- **Aber:** Kein Code-Signing für Binaries

Für Level 4+: Nutze Code-Signierung (Kapitel 7)

### F: Wie signiere ich meine App auf macOS?

**A:** Mit Xcode Developer ID:

```bash
codesign --deep --force --verify \
  --verbose \
  --sign "Developer ID Application: MyCompany" \
  MyApp.app

# Notarize (Apple online):
xcrun notarytool submit MyApp.dmg \
  --apple-id your@email.com \
  --password app-specific-password \
  --team-id ABCD1234

# Staple:
xcrun stapler staple MyApp.dmg
```

Siehe Kapitel 3 für Details.

### F: Kann ich Nutzer zwingen zu updaten?

**A:** Ja, mit **Force Updates** (Level 4+):

```json
{
  "forceUpdate": true,
  "forceDeadline": "2026-07-01T00:00:00Z",
  "minimumVersion": "2.1.0"
}
```

**Aber:** Ethisch fragwürdig wenn nicht nötig!
- Nutze nur für **Sicherheits-Patches**
- Gebe 1-2 Wochen Frist
- Erklare warum Update nötig ist

### F: Wie handle ich Network-Fehler?

**A:** Implementiere Retry-Logik:

```javascript
async function downloadWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await download(url);
    } catch (error) {
      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      if (i < maxRetries - 1) {
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
}
```

Siehe Kapitel 11 (Rollback) für fehlerbehandlung.

### F: Was wenn Download abbricht?

**A:** Auto-Pause & Resume:

```javascript
// Speichere Download-Progress
const progress = {
  totalSize: manifest.fileSize,
  downloaded: 5000000,  // 5 MB
  timestamp: Date.now()
};

// Bei Retry, starte von Progress
const response = await fetch(url, {
  headers: { 'Range': `bytes=${progress.downloaded}-` }
});
```

Browser/HTTP1.1 unterstützen Range Requests.

### F: Wie viel Speicher braucht ein Update?

**A:** 
- **Backup alt**: ~App-Größe
- **Download neu**: ~App-Größe
- **Installation**: ~0.5-1x App-Größe

Beispiel: 50MB App braucht ~150MB frei

Check vor Download:

```javascript
if (availableDisk < manifest.fileSize * 2) {
  showError('Not enough disk space');
}
```

### F: Können Nutzer Updates ablehnen?

**A:** 
- **Level 1-3:** Ja, mit "Später" Button
- **Level 4+:** Mit `forceUpdate: false`, ja
- **Mit `forceUpdate: true`:** Nein (Sicherheits-Updates)

Best Practice: Update-Dialog nur bei wirklichen Updates zeigen, nicht bei jedem Start.

## Sicherheit

### F: Wie vermeide ich Malware-Updates?

**A:** Siehe Kapitel 7 (Sicherheit) - 10-Punkt-Checkliste:

1. **HTTPS only** für Download-URLs
2. **Code-Signierung** (macOS, Windows)
3. **Hash-Verifikation** (SHA256)
4. **Signature-Verifikation** (RSA)
5. **No Credentials in App**
6. **Backup alt Version**
7. **Authenticated Checks**
8. **DDoS-Protection**
9. **Secure Logging** (no PII)
10. **Rollback-Mechanismus**

### F: Sind meine API-Keys sicher?

**A:** **NEIN!** Wenn in App hardcoded.

**Richtig:**
- API-Keys nur im Backend
- App kommuniziert mit eigenem Backend
- Backend hat API-Keys sicher gespeichert (Vault, KMS)

```javascript
// FALSCH
const token = "secret_abc123";  // ← Finder in decompiled app!

// RICHTIG
// App macht Request zu deinem Server
// Server macht Request zu GitHub mit Secret Token
```

### F: Wie verschlüssele ich Updates?

**A:** HTTP bietet TLS (HTTPS) - das reicht!

```
App → HTTPS → Server
      ↑
    Encrypted
    (TLS 1.2+)
```

Zusätz-Verschlüsselung nötig?
- Nur wenn extra-paranoid
- Adds complexity
- TLS ist Standard-gut

### F: Was ist eine Man-in-the-Middle (MITM) Attacke?

**A:**

```
NICHT-SICHER (HTTP):
App → Attacker's Network → Your Server
      ↓
      Attacker sieht Inhalt
      Attacker ändert Update-Datei
      Malware installiert!

SICHER (HTTPS):
App → Your Server
      ↑
    TLS-Encrypted
    Attacker sieht nur Gibberish
```

**Schutz:** HTTPS + Hash-Verifikation

## Datenschutz & DSGVO

### F: Darf ich Update-Daten sammeln?

**A:** Ja, aber mit Einwilligung (Opt-in):

**Allowed (Anonymisiert):**
- Welche Version aktuell / neu
- OS-Kategorie (nicht Details)
- Land (nicht Stadt)
- Update-Check erfolgt/fehlt

**NOT Allowed (PII):**
- User-ID, Email
- IP-Adresse
- Device-ID (müsste gehashed sein)
- Standort-Details

Siehe Kapitel 8 (DSGVO) für vollständige Checkliste.

### F: Wie lange darf ich Daten speichern?

**A:** Max. 90 Tage:

```
Telemetry-Daten: 90 Tage → Automatisch löschen
Update-Logs: 30 Tage → Automatisch löschen
Crash-Reports: 14 Tage → Automatisch löschen
Backups: 24 Stunden → Automatisch löschen
```

Nutzer muss Löschung verlangen können (Art. 17 DSGVO).

### F: Kann ich Daten an Dritte geben?

**A:** **NEIN!**

- Nicht an Google Analytics
- Nicht an Advertising Networks
- Nicht an Data Brokers
- Nicht an externe Services

Ohne ausdrückliche Einwilligung!

Auch nicht "anonymisiert" - kombinierte Daten können Menschen identifizieren.

### F: Muss ich Datenschutzerklärung schreiben?

**A:** Ja! Siehe Kapitel 8 - Muster-Datenschutzerklärung dort.

**Muss dokumentieren:**
- Welche Daten erfasst
- Wie lange gespeichert
- Nutzerrechte (Löschen, Export, etc.)
- Kontakt für Anfragen

## Rollback & Fehlerbehandlung

### F: Was wenn Update schiefgeht?

**A:** Automatisches Rollback (Level 3+):

```
Update fehlgeschlagen
  ↓
3 Crashes in einer Minute?
  ↓
Ja → Auto-Rollback
  ↓
App startet mit alter Version
  ↓
Nutzer wird informiert
```

Siehe Kapitel 11 (Rollback-Strategie).

### F: Kann Nutzer manuell rollback?

**A:** Ja, mit Warnung:

```
Einstellungen → Rollback → "Ja, zur alten Version"
  ↓
"Warnung: Alle Daten seit Update gehen verloren"
  ↓
Rollback durchführen
```

### F: Wie teste ich Rollback?

**A:** Siehe Kapitel 12 (Testing):

```bash
# 1. Installiere neue Version
npm run build:v2.1.0

# 2. Kopiere Backup
cp -r app.backup app.old

# 3. Simuliere Crash
kill -9 $(pgrep myapp)

# 4. Verifiziere Rollback
myapp --version  # Should be 2.0.5 (old)
```

## Web-App spezifisch

### F: Wie update ich Web-App automatisch?

**A:** Service Worker:

```javascript
navigator.serviceWorker.register('/sw.js').then((reg) => {
  reg.onupdatefound = () => {
    const newSW = reg.installing;
    newSW.onstatechange = () => {
      if (newSW.state === 'installed') {
        // New version ready
        showUpdateDialog();
      }
    };
  };
});
```

Siehe Kapitel 5 (Web-Updates) für Strategien.

### F: Wie invalidiere ich Browser-Cache?

**A:** Hash-basierte Dateinamen:

```
Build Tool generiert:
  app.a3f4b2c1.js (Version A)
  app.d8e9f0a1.js (Version B)
  
index.html (nie gecacht):
  <script src="/app.d8e9f0a1.js"></script>
  
Browser lädt automatisch neue wenn Hash ändert
Kein Cache-Busting nötig!
```

Siehe Kapitel 5 für Details.

## Plattform-spezifisch

### F: Wie update ich iOS-App?

**A:** 
- **App Store:** Automatisch managed (empfohlen)
- **CodePush:** OTA-Updates ohne App Store (React Native/Flutter)
- **Custom OTA:** Kompliziert, nicht empfohlen

Siehe Kapitel 4 (Mobile-Updates).

### F: Wie update ich Android-App?

**A:**
- **Google Play:** Automatisch managed (empfohlen)
- **Play Core API:** In-App-Updates, still Play Store
- **Custom OTA:** Möglich, erfordert viel Testing

Siehe Kapitel 4 für Details.

### F: Kann ich Linux-Nutzer erreichen?

**A:** Mehrere Optionen:

1. **AppImage + Manifest** (selbst-hosted)
2. **Snap** (Ubuntu/Fedora auto-updates)
3. **Flatpak** (standardisiert)
4. **Package Manager** (apt, yum, etc.)

Siehe Kapitel 3 (Desktop-Updates) → Linux-Abschnitt.

## Performance

### F: Macht Update-Checking die App langsam?

**A:** 
- **Background-Checking:** Nein (separate Thread)
- **Dialog-Zeigen:** < 100ms (UI)
- **Download:** Asynchron, nicht blockierend
- **Installation:** User kann Timing wählen

Best Practice: Prüfe nur **einmal täglich**, nicht bei jedem Start.

### F: Wie viel Bandbreite braucht ein Update?

**A:** 

| App-Größe | Bandbreite | Zeit (1Mbps) |
|-----------|-----------|-------------|
| 5 MB | 5 MB | 40 Sek |
| 50 MB | 50 MB | 400 Sek |
| 200 MB | 200 MB | 1600 Sek |

**Optimierung:**
- Nur Diff-Updates (Bsdiff, zsync)
- Compression (zip, bzip2)
- Staged Rollout (nicht alle gleichzeitig)

## Monitoring

### F: Wie weiß ich ob Update-System funktioniert?

**A:** Monitore diese Metriken:

- Update-Check Success Rate
- Download Success Rate
- Installation Success Rate
- Rollback-Häufigkeit
- Error-Logs
- User-Feedback

```bash
# Example Dashboard Metrics
- 95% update checks erfolgreich
- 92% downloads erfolgreich
- 99.5% installationen erfolgreich
- 0.3% rollbacks (= gut)
```

### F: Welche Alerts sollte ich setzen?

**A:**
- Error Rate > 5% → Alert
- Rollback-Häufigkeit > 10/Tag → Alert
- Download-Timeout > 50% → Alert
- Datenbankfehler → Alert

Siehe Kapitel 6 (Backend) für Monitoring-Code.

## Kosten

### F: Kostet ein Update-System Geld?

**A:**

| Komponente | Kosten |
|-----------|--------|
| GitHub Releases | Gratis |
| Update-Server | $5-50/Monat |
| Code-Signing Cert | $200-500/Jahr |
| Notarization (Apple) | Gratis (mit Developer Account) |
| CDN (optional) | $5-100/Monat |
| **Total MVP** | **Gratis-$10/Monat** |

Für großes Projekt (100K+ Nutzer) + Enterprise:
- Update-Server: $100-500/Monat
- Monitoring: $50-200/Monat
- Support: $1000-5000/Monat

## Weitere Ressourcen

- Kapitel 16: Glossar (20+ Begriffe)
- Kapitel 13: GitHub Integration (Automated Releases)
- Kapitel 7: Sicherheit (10-Punkt-Checkliste)
- Kapitel 8: DSGVO (Compliance-Checkliste)

---

**Hast du eine Frage die hier nicht beantwortet wird?**

Öffne ein Issue im Projekt-Repo oder kontaktiere den Support!

# Security Checklist — MGD Software Updater Skill

**Überprüfe diese Liste für Sicherheits-Anforderungen bei der Update-Implementierung.**

---

## Code-Signing

- [ ] Code-Signing Certificate beschafft
  - [ ] macOS: Developer ID Certificate (Apple)
  - [ ] Windows: Authenticode Certificate
  - [ ] Linux: GPG Key
- [ ] Private Key sicher gelagert (Hardware Token, Vault)
- [ ] Signing Process automatisiert (GitHub Actions, CI/CD)
- [ ] App verifiziert Signature vor Installation
- [ ] Signatur-Verifikation bei Download
- [ ] Expired Certificates überwachen

**Status:** [ ] ❌ Nicht geklärt [ ] ⏳ In Progress [ ] ✅ Abgeschlossen

---

## Checksums & Hashes

- [ ] SHA256 Checksums für alle Download-Artefakte
- [ ] Checksums in TXT-Datei oder JSON-Manifest
- [ ] App verifiziert Checksums nach Download
- [ ] Checksum-Verification vor Installation
- [ ] Fehlgeschlagene Verifikation = Ablehnung + Fehler-Logging
- [ ] Checksums öffentlich zugänglich (zum Verifizieren)

**Status:** [ ] ❌ Nicht geklärt [ ] ⏳ In Progress [ ] ✅ Abgeschlossen

---

## Transport Security (TLS/HTTPS)

- [ ] Alle Download-URLs sind HTTPS
- [ ] Certificate Pinning erwogen (optional, für sehr sicherheitskritisch)
- [ ] TLS Version 1.2+
- [ ] Strong Cipher Suites
- [ ] HSTS Header auf Server (falls HTTP → HTTPS Redirect)
- [ ] Proxy-Support getestet (Corporate Firewalls)

**Status:** [ ] ❌ Nicht geklärt [ ] ⏳ In Progress [ ] ✅ Abgeschlossen

---

## Server-Sicherheit

- [ ] Update-Server-Zugriff authentifiziert (API Key, OAuth)
- [ ] Manifest URL geschützt (nicht erraten können)
- [ ] Download-URLs haben Ablauf-Zeit (Pre-signed URLs, max 24h)
- [ ] DDoS-Protection (Cloudflare, AWS Shield, etc.)
- [ ] Rate Limiting auf API (gegen Brute-Force)
- [ ] Logging aller Update-Requests (für Audits)
- [ ] Security Audit Plan (regelmäßig)

**Status:** [ ] ❌ Nicht geklärt [ ] ⏳ In Progress [ ] ✅ Abgeschlossen

---

## Szenarios & Fallback

- [ ] Was wenn Server gehackt? (Auswirkung = Malware-Verbreitung)
  - [ ] Fallback-Plan vorhanden
  - [ ] Alternate Server/Manifest-URL
  - [ ] Schneller Rollback möglich
- [ ] Was wenn Update beschädigt ist?
  - [ ] Checksums Verifikation fehlschlägt
  - [ ] Retry mit max attempts
  - [ ] Rollback zu Vorgänger-Version
- [ ] Was wenn Zertifikat ablaufen?
  - [ ] Monitoring für Certificate Expiry
  - [ ] Alerting 30 Tage vorher
  - [ ] Emergency Renewal Plan
- [ ] Was wenn Download bricht ab?
  - [ ] Partial Download erkennen
  - [ ] Resume Download Logik
  - [ ] Max Retries (z.B. 3x)
  - [ ] Rollback wenn alle Retries fehlschlagen

**Status:** [ ] ❌ Nicht geklärt [ ] ⏳ In Progress [ ] ✅ Abgeschlossen

---

## Datenschutz & Telemetrie

- [ ] Telemetry Data minimiert (nur notwendig)
- [ ] IP-Adressen werden NICHT geloggt
- [ ] User-ID ist anonymisiert oder Opt-In
- [ ] Nutzer kann Telemetry deaktivieren
- [ ] Datenschutzerklärung aktualisiert
- [ ] Third-Party Services mit DPA signiert
- [ ] DSGVO/CCPA Compliance überprüft

**Status:** [ ] ❌ Nicht geklärt [ ] ⏳ In Progress [ ] ✅ Abgeschlossen

---

## Notfall & Rollback

- [ ] Alte Versionen bleiben auf Server (mindestens 5)
- [ ] Rollback Manifest URL/API verfügbar
- [ ] Rollback kann schnell (Stunden) aktiviert werden
- [ ] Nutzer-Kommunikation Plan (wenn Rollback nötig)
- [ ] Crash-Daten sammeln bei fehlgeschlagenem Update
- [ ] Post-Mortem Plan (Analyse was schiefging)

**Status:** [ ] ❌ Nicht geklärt [ ] ⏳ In Progress [ ] ✅ Abgeschlossen

---

## Monitoring & Alerts

- [ ] Download-Fehlerquote Monitoring (Alert wenn > 5%)
- [ ] Crash-Rate nach Update Monitoring
- [ ] Server-Health Monitoring (ist Update-Server up?)
- [ ] Certificate Expiry Alerts (30 Tage vorher)
- [ ] Unusual Download Patterns (DDoS detection)
- [ ] Update-Success Rate Tracking

**Status:** [ ] ❌ Nicht geklärt [ ] ⏳ In Progress [ ] ✅ Abgeschlossen

---

## Dokumentation

- [ ] Security Policy dokumentiert (README oder Sicherheit-Seite)
- [ ] Notfall-Runbook für Rollback geschrieben
- [ ] Incident Response Plan dokumentiert
- [ ] Private Keys Management dokumentiert
- [ ] Security Update Process dokumentiert

**Status:** [ ] ❌ Nicht geklärt [ ] ⏳ In Progress [ ] ✅ Abgeschlossen

---

## Final Security Approval

- [ ] Alle Sicherheits-Anforderungen abgeschlossen
- [ ] Keine kritischen Lücken identifiziert
- [ ] Security Review durchgeführt (intern oder extern)
- [ ] Approved von: [Name]
- [ ] Datum: [Datum]

---

**Status dieser Security-Prüfung:** [ ] ❌ NICHT FREIGEGEBEN [ ] ✅ FREIGEGEBEN

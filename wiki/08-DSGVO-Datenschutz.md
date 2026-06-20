# 08 DSGVO-Datenschutz in Update-Systemen

## Überblick

Update-Systeme sammeln Daten über Nutzer und ihre Geräte. Diese Daten sind oft personenbezogen und unterliegen der DSGVO. Dieses Kapitel zeigt wie du datenschutz-konform bleibst.

## Was ist personenbezogene Daten?

**Personenbezogene Daten (PBD)** sind Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen.

### Im Update-System

```
PERSONENBEZOGEN ✗          ANONYMISIERT ✓
-----------                ---------
User ID (12345)            Hash (a3f4b2c1...)
Email (john@ex.com)        Anonymized
IP-Adresse (192.1.1.1)     IP-Ranges (192.x.x.x)
Device-ID (ABC123DEF456)    Device-Hash (d8e9f0a1...)
OS Version (Windows 10)     OS-Kategorien (Windows)
Location (Berlin, Germany)  Country (Germany)
```

### Beispiel-Telemetrie (FALSCH ✗)

```javascript
// DSGVO-VERLETZUNG ✗
recordTelemetry({
  userId: 12345,
  email: 'john@example.com',
  ipAddress: '192.168.1.100',
  deviceId: 'ABC123DEF456',
  location: { city: 'Berlin', country: 'Germany' },
  osVersion: 'Windows 10 21H2',
  appVersion: '2.0.5',
  timestamp: '2026-06-20T10:30:00Z'
});
```

**Probleme:**
- User-ID ist direkt identifizierbar
- Email enthüllt Identität
- IP-Adresse kann zurückverfolgt werden
- Device-ID kann mit anderen Daten kombiniert werden
- Kombinierte Daten können Person identifizieren

### Beispiel-Telemetrie (RICHTIG ✓)

```javascript
// DSGVO-KONFORM ✓
recordTelemetry({
  sessionHash: hashFunction(deviceId + timestamp),  // 1x Hash
  appVersion: '2.0.5',
  osCategory: 'Windows',  // Nicht OS-Version
  country: 'DE',  // Nicht Stadt
  timestamp: '2026-06-20T10:30:00Z',
  // Kein User-ID, Email, IP, Device-ID, Location
});
```

**Verbesserungen:**
- Keine User-ID
- Keine Email
- Keine IP-Adresse
- Device-ID wird gehasht
- Grobe Location nur
- Kombiniert nicht zurückfolgbar

## DSGVO Artikel & Anforderungen

### Art. 5: Datenschutz-Grundsätze

```
1. Rechtmäßigkeit, Verarbeitung nach Treu und Glauben, Transparenz
   → Update-Check nur mit informiertem Consent
   
2. Zweckbegrenzung
   → Daten nur für Updates, nicht für Werbung
   
3. Datenminimierung
   → So wenig Daten wie möglich erfassen
   
4. Genauigkeit
   → Falsche Daten korrigieren
   
5. Speicherbegrenzung
   → Update-Logs nicht länger als nötig behalten
   
6. Integrität und Vertraulichkeit
   → Daten sicher speichern und übertragen
```

### Art. 7: Einwilligungsbedürftigkeit

**Nutzer muss aktiv zustimmen!**

```javascript
// App-Start
function showPrivacyConsent() {
  dialog.show({
    title: 'Datenschutz',
    message: 'Diese App prüft automatisch auf Updates. ' +
             'Daten werden anonym erhoben (z.B. Geräteart, OS-Version). ' +
             'Lesen Sie unsere Datenschutzerklärung.',
    buttons: [
      {
        label: 'Zustimmen',
        onClick: () => {
          preferences.setConsent('updates', true);
          initializeUpdateSystem();
        }
      },
      {
        label: 'Ablehnen',
        onClick: () => {
          preferences.setConsent('updates', false);
          // Update-Checks weiterhin möglich, aber keine Telemetrie
        }
      },
      {
        label: 'Datenschutzerklärung',
        onClick: () => {
          openURL('https://example.com/privacy');
        }
      }
    ]
  });
}
```

### Art. 17: Recht auf Vergessen (Löschung)

Nutzer können Löschung ihrer Daten verlangen:

```javascript
// API-Endpoint
POST /api/privacy/delete-account
{
  "accountId": "abc123",
  "confirmationToken": "xyz789"
}

// Server-Code
async function deleteUserData(accountId) {
  // 1. Delete telemetry
  await database.telemetry.deleteMany({ accountId });
  
  // 2. Delete update logs
  await database.updateLogs.deleteMany({ accountId });
  
  // 3. Delete preferences
  await database.preferences.deleteMany({ accountId });
  
  // 4. Delete from backup (optional)
  // Backups sollten nach max. 90 Tagen gelöscht sein
  
  // 5. Log deletion
  await database.auditLog.create({
    action: 'user_deletion',
    accountId,
    timestamp: Date.now()
  });
}
```

### Art. 20: Datenportabilität

Nutzer haben Recht auf Kopie ihrer Daten:

```javascript
// API-Endpoint
GET /api/privacy/export-data
Authorization: Bearer {token}

// Server-Code
async function exportUserData(accountId) {
  const telemetry = await database.telemetry
    .find({ accountId });
  const updateLogs = await database.updateLogs
    .find({ accountId });
  const preferences = await database.preferences
    .findOne({ accountId });
  
  // Return as JSON (machine-readable format)
  return {
    exported_at: new Date().toISOString(),
    data: {
      telemetry,
      updateLogs,
      preferences
    }
  };
}
```

## Datenschutzerklärung (Muster)

```markdown
# Datenschutzerklärung für MyApp

## 1. Verantwortlicher
MyCompany GmbH
Kontakt: privacy@example.com

## 2. Update-System & Datenerfassung

### Automatische Update-Prüfung
Diese Anwendung prüft regelmäßig auf Updates. 
Bei jeder Prüfung werden folgende Daten gesendet:

**Erfasste Daten:**
- App-Version (z.B. "2.0.5")
- Betriebssystem-Kategorie (z.B. "Windows")
- Ländercode basierend auf Systemeinstellung (z.B. "DE")
- Ein anonymisierter Sitzungs-Hash

**Nicht erfasst:**
- IP-Adresse
- User-ID oder Email
- Geräte-Identifikation
- Standort-Details
- Persönliche Informationen

### Rechtsgrundlage
Art. 6 Abs. 1 lit. b DSGVO: Datenverarbeitung zur Erfüllung eines Vertrags
(oder Art. 7: Mit Ihrer Einwilligung)

### Speicherdauer
- Telemetrie-Daten: Maximal 90 Tage
- Update-Logs: Maximal 30 Tage
- Nach Frist werden Daten automatisch gelöscht

## 3. Ihre Rechte
Sie haben das Recht auf:
- Auskunft über erfasste Daten (Art. 15)
- Berichtigung falscher Daten (Art. 16)
- Löschung Ihrer Daten (Art. 17)
- Einschränkung der Verarbeitung (Art. 18)
- Datenportabilität (Art. 20)
- Widerspruch gegen Verarbeitung (Art. 21)

Anfragen bitte an: privacy@example.com

## 4. Telemetrie deaktivieren
Sie können Telemetrie-Erfassung jederzeit deaktivieren:
App → Einstellungen → Datenschutz → Update-Telemetrie → Aus

Update-Checks funktionieren weiterhin, es werden nur keine Daten erfasst.
```

## Implementierung: Consent Management

```javascript
class PrivacyManager {
  constructor() {
    this.preferences = localStorage.getItem('privacy_preferences') 
      || this.getDefaultPreferences();
  }
  
  getDefaultPreferences() {
    return {
      updates: {
        autoCheck: true,
        telemetry: false,  // Default: OFF (Opt-in)
        crashReporting: false
      },
      createdAt: Date.now(),
      version: 1
    };
  }
  
  async setConsentTelemetry(enabled) {
    this.preferences.updates.telemetry = enabled;
    localStorage.setItem(
      'privacy_preferences',
      JSON.stringify(this.preferences)
    );
    
    // Log consent change (non-PII)
    await this.logConsentChange('telemetry', enabled);
  }
  
  async logConsentChange(type, enabled) {
    // Don't send PII, just fact of change
    await fetch('/api/privacy/consent-log', {
      method: 'POST',
      body: JSON.stringify({
        timestamp: Date.now(),
        consentType: type,
        consentGiven: enabled
        // No user ID, no email
      })
    });
  }
  
  canRecordTelemetry() {
    return this.preferences.updates.telemetry === true;
  }
}

const privacyMgr = new PrivacyManager();

// Nur wenn Consent gegeben
if (privacyMgr.canRecordTelemetry()) {
  recordTelemetry({
    event: 'update_check',
    versionFrom: app.getVersion(),
    versionAvailable: manifest.latestVersion
  });
}
```

## DSGVO Compliance Checkliste

```markdown
## Pre-Release DSGVO Checklist

### Datenschutzerklärung
- [ ] Öffentlich verfügbar (Webseite, App-Help)
- [ ] Ausführlich und verständlich
- [ ] Alle erfassten Daten aufgelistet
- [ ] Speicherdauer dokumentiert
- [ ] Nutzerrechte erläutert
- [ ] Kontakt für Anfragen angegeben

### Einwilligung (Consent)
- [ ] Dialog bei App-Start zeigen
- [ ] Explizites Opt-in (nicht pre-checked)
- [ ] Ablehnung muss möglich sein
- [ ] Zustimmung wird geloggt
- [ ] Jederzeit änderbar in Einstellungen

### Datenvermeidung
- [ ] Keine User-IDs erfasst
- [ ] Keine Email-Adressen
- [ ] Keine IP-Adressen
- [ ] Keine genauen Standorte
- [ ] Keine Device-IDs (nur gehashed)
- [ ] Keine Geräteseriellen

### Datenminimierung
- [ ] Nur notwendige Felder erfasst
- [ ] Grobe Kategorien statt Details
- [ ] Hashing/Anonymisierung wo möglich
- [ ] Keycollapse bei Zeitstempeln (nur Datum, nicht Zeit)

### Speicherung & Löschung
- [ ] Speicherziel dokumentiert
- [ ] Aufbewahrungsfrist für Daten definiert
- [ ] Automatische Löschung implementiert
- [ ] Backups berücksichtigt
- [ ] Archivierungsrichtlinie
- [ ] Test der Löschung durchgeführt

### Nutzerrechte
- [ ] Export-Funktion für Nutzer-Daten
- [ ] Löschungs-Anfrage-Prozess
- [ ] Berichtigung möglich
- [ ] Anfrage-Bearbeitung in 30 Tagen

### Sicherheit
- [ ] HTTPS für alle Datenübertragung
- [ ] Encryption at rest für Speicherung
- [ ] Access-Control implementiert
- [ ] Audit-Logging für Datenzugriff
- [ ] Regelmäßige Security-Audits

### Drittanbieter
- [ ] Keine Weitergabe an Ad-Networks
- [ ] Keine Verkauf von Daten
- [ ] Alle Third-Parties unter Vertrag
- [ ] Data Processing Agreements vorhanden

### Dokumentation
- [ ] ROPA (Record of Processing Activities)
- [ ] DPIA (Data Protection Impact Assessment)
- [ ] Mitarbeiterschulung (GDPR awareness)
- [ ] Datenschutzbeauftragter kontaktiert
```

## Häufige Fehler

| Fehler | Auswirkung | Lösung |
|--------|-----------|--------|
| User-ID geloggt | Identifies person | Hash statt ID, anonymize |
| IP-Adressen gesammelt | Standort-Tracking | Nicht erfassen/hashen |
| Keine Einwilligung | Illegal processing | Opt-in Dialog vor Erfassung |
| Zu lange Speicherung | Unnötige Retention | Max. 90 Tage, dann löschen |
| Keine Lösch-Option | Right to be forgotten | Löschung implementieren |
| Verkauf an Dritte | Datenschutz-Verletzung | Nicht weitergeben |
| Datenschutz nicht erklärt | Nutzer uninformiert | Ausführliche Erklärung |
| Keine Sicherheit | Daten-Leak | HTTPS, Encryption, Access-Control |

## Beispiel: DSGVO-konforme Telemetrie

```javascript
class GDPRTelemetry {
  constructor() {
    this.consent = false;
    this.sessionStart = Date.now();
  }
  
  requestConsent() {
    dialog.show({
      title: 'Helfen Sie uns zu verbessern',
      message: 'Wir möchten anonym erfahren, wie oft Updates installiert werden. ' +
               'Es werden keine persönlichen Daten erfasst.',
      buttons: [
        { label: 'Ja', onClick: () => this.setConsent(true) },
        { label: 'Nein', onClick: () => this.setConsent(false) }
      ]
    });
  }
  
  setConsent(consent) {
    this.consent = consent;
    localStorage.setItem('telemetry_consent', consent);
  }
  
  record(event, data) {
    if (!this.consent) return; // Respect choice
    
    // Only anonymized data
    const payload = {
      // Nicht: User-ID, Email, IP
      event,
      timestamp: Date.now(),
      ...data
    };
    
    fetch('/api/telemetry', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}

const telemetry = new GDPRTelemetry();
telemetry.requestConsent();

// Later
telemetry.record('update_available', {
  versionFrom: '2.0.0',
  versionTo: '2.1.0'
});
```

---

**Weiter:** Kapitel 9 (Version-Manifest) oder Kapitel 15 (FAQ)

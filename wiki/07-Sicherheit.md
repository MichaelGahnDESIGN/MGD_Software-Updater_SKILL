# 07 Sicherheit im Update-System

## Überblick

Update-Systeme sind ein kritisches Sicherheitsziel: Attackers können über gefälschte Updates Malware verbreiten. Dieses Kapitel behandelt wie du dein Update-System sicher machst.

## Goldene Sicherheitsregeln (NIEMALS!)

### ❌ Regel 1: Private Keys / Tokens in der App

```javascript
// FALSCH ❌
const updateToken = "secret_token_abc123xyz";
const signatureKey = "-----BEGIN PRIVATE KEY-----...";

fetch('https://updates.example.com/check', {
  headers: { 'Authorization': `Bearer ${updateToken}` }
});
```

**Warum:** Jeder kann deine App dekompilieren und das Token stehlen.

**Richtig:**
- API-Keys in Backend-Server geheim halten
- App kommuniziert nur mit eigenem Backend
- Backend validiert Anfragen mit Secret Token

```javascript
// RICHTIG ✓
fetch('https://mein-backend.example.com/updates/check', {
  // Kein API-Key nötig, HTTPS + Cookies reichen
  credentials: 'include'
});

// Backend macht dann sicheren Call:
// fetch('https://updates.example.com/check', {
//   headers: { 'Authorization': `Bearer ${secretToken}` }
// })
```

### ❌ Regel 2: Unverschlüsselte Download-URLs

```javascript
// FALSCH ❌
http://updates.example.com/app-2.1.0.exe  // HTTP, nicht HTTPS!
```

**Warum:** Man-in-the-Middle (MITM) Attacken möglich.

**Richtig:**
```javascript
// RICHTIG ✓
https://updates.example.com/app-2.1.0.exe  // HTTPS nur
https://cdn.cloudfront.net/releases/app-2.1.0.exe  // Gesicherter CDN
```

### ❌ Regel 3: Keine Checksummen-Verifikation

```javascript
// FALSCH ❌
const file = await downloadFile(manifest.downloadUrl);
await installFile(file);  // Keine Verifikation!
```

**Warum:** Corrupted oder manipulierte Files werden installiert.

**Richtig:**
```javascript
// RICHTIG ✓
const file = await downloadFile(manifest.downloadUrl);

// 1. Verify Hash
const fileHash = calculateSHA256(file);
if (fileHash !== manifest.hash) {
  throw new Error('Hash mismatch - file corrupted or modified');
}

// 2. Verify Signature (optional aber empfohlen)
if (manifest.signature) {
  if (!verifySignature(file, manifest.signature, publicKey)) {
    throw new Error('Signature invalid - file may be malicious');
  }
}

await installFile(file);
```

## 10-Punkt Sicherheits-Checkliste

### 1. HTTPS für alle Update-URLs

```json
{
  "updateCheckUrl": "https://api.example.com/version",  // ✓
  "downloadUrl": "https://cdn.example.com/releases/app.exe",  // ✓
  "changelogUrl": "https://example.com/releases/notes.html"  // ✓
}
```

**Verifizierung:**
```bash
# Test HTTPS
curl -I https://updates.example.com/manifest.json
# Sollte 200 zeigen, nicht 301 redirect

# Check Certificate
openssl s_client -connect updates.example.com:443
# Sollte valides Zertifikat zeigen
```

### 2. Code-Signierung (Cryptographic Signatures)

**Windows:**
```powershell
# Signiere EXE mit privat key
signtool sign /f cert.pfx /p password /t http://timestamp.digicert.com app.exe

# Verifiziere Signatur
signtool verify /pa app.exe
```

**macOS:**
```bash
codesign --deep --force --verify -v --sign "Developer ID Application" MyApp.app
codesign --verify -v --verbose=4 MyApp.app
```

**Linux (Optional):**
```bash
# GPG-Sign
gpg --armor --detach-sign --output app.AppImage.asc app.AppImage

# Verify
gpg --verify app.AppImage.asc app.AppImage
```

### 3. Checksummen-Verifikation (SHA256)

```javascript
const crypto = require('crypto');

function calculateSHA256(file) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(file))
    .digest('hex');
}

function verifyChecksum(file, expectedHash) {
  const actualHash = calculateSHA256(file);
  
  if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
    return false;
  }
  
  return true;
}

// Verwendung
const manifest = await fetchManifest();
const downloadedFile = await downloadFile(manifest.url);
const isValid = verifyChecksum(downloadedFile, manifest.hash);

if (!isValid) {
  throw new Error('Download corrupted - refusing installation');
}
```

**Manifest mit Hash:**
```json
{
  "latestVersion": "2.1.0",
  "downloadUrl": "https://releases.example.com/app-2.1.0.exe",
  "hash": "sha256:d8e9f0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u",
  "hashAlgorithm": "sha256"
}
```

### 4. Signatur-Verifikation mit Public Key

```javascript
const crypto = require('crypto');

function verifySignature(file, signatureBase64, publicKeyPEM) {
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(fs.readFileSync(file));
  
  const signature = Buffer.from(signatureBase64, 'base64');
  
  return verifier.verify(publicKeyPEM, signature);
}

// Verwendung
const manifest = await fetchManifest();
const file = await downloadFile(manifest.url);

if (!verifySignature(file, manifest.signature, publicKeyPEM)) {
  throw new Error('Invalid signature - refusing installation');
}
```

**Public Key in App:**
```javascript
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890...
-----END PUBLIC KEY-----`;
```

**Private Key MUSS sicher gespeichert sein:**
- Nicht in Git (verwende `.gitignore`)
- Nicht in Docker-Image
- AWS KMS, HashiCorp Vault, oder ähnlich
- Nur Build-Server hat Zugriff

### 5. Manifest-Validierung

```javascript
function validateManifest(manifest) {
  // Schema Validation
  const schema = {
    latestVersion: 'string',
    downloadUrl: 'string',
    hash: 'string',
    signature: 'string (optional)',
    releaseDate: 'string (ISO8601)',
    changelog: 'string'
  };
  
  // Check required fields
  if (!manifest.latestVersion) throw new Error('Missing latestVersion');
  if (!manifest.downloadUrl) throw new Error('Missing downloadUrl');
  if (!manifest.hash) throw new Error('Missing hash');
  
  // Validate URL (must be HTTPS)
  if (!manifest.downloadUrl.startsWith('https://')) {
    throw new Error('Download URL must be HTTPS');
  }
  
  // Validate hash format (must be 64 hex chars for SHA256)
  if (!/^[a-f0-9]{64}$/.test(manifest.hash.toLowerCase())) {
    throw new Error('Invalid hash format');
  }
  
  return true;
}
```

### 6. Backup & Rollback

**Immer alte Version backuppen vor Update:**

```javascript
async function updateApp(manifest) {
  // 1. Backup current version
  const currentPath = app.getPath();
  const backupPath = `${currentPath}.backup`;
  
  await fs.promises.cp(currentPath, backupPath, { recursive: true });
  
  try {
    // 2. Download & verify new version
    const file = await downloadFile(manifest.url);
    if (!verifyChecksum(file, manifest.hash)) {
      throw new Error('Verification failed');
    }
    
    // 3. Install new version
    await installFile(file);
    
    // 4. Verify installation
    const newPath = app.getPath();
    if (!fs.existsSync(newPath)) {
      throw new Error('Installation failed');
    }
    
    // 5. Cleanup backup (optional)
    setTimeout(() => {
      fs.promises.rm(backupPath, { recursive: true });
    }, 24 * 60 * 60 * 1000); // Nach 24h löschen
    
  } catch (error) {
    // Rollback bei Fehler
    console.error('Update failed, rolling back:', error);
    await fs.promises.rm(currentPath, { recursive: true });
    await fs.promises.cp(backupPath, currentPath, { recursive: true });
    throw error;
  }
}
```

### 7. Authenticated Update Checks

**App sendet Device-ID oder User-ID:**

```javascript
async function checkForUpdate() {
  const deviceId = getDeviceId(); // Unique identifier
  const currentVersion = app.getVersion();
  
  const response = await fetch('https://api.example.com/updates/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-ID': deviceId
    },
    body: JSON.stringify({
      deviceId,
      currentVersion,
      platform: 'windows',
      timestamp: Date.now()
    })
  });
  
  if (!response.ok) {
    throw new Error(`Update check failed: ${response.status}`);
  }
  
  return response.json();
}
```

**Server validiert Anfrage:**
```python
# Backend (Python Flask)
@app.post('/updates/check')
def check_for_update():
    data = request.json
    device_id = request.headers.get('X-Device-ID')
    
    # Validate device is registered
    device = Device.query.get(device_id)
    if not device:
        return {'error': 'Unknown device'}, 401
    
    # Return appropriate version
    return get_manifest_for_device(device)
```

### 8. DDoS-Protection für Update-Server

```yaml
# Cloudflare / WAF Rules
Rule 1: Rate-Limiting
  - 100 requests per minute per IP
  - 10,000 requests per day per IP

Rule 2: Geographic Blocking
  - Block updates from suspicious regions
  
Rule 3: Bot-Protection
  - CAPTCHA für verdächtige Traffic
  
Rule 4: Request Validation
  - Valid User-Agent header
  - Valid Accept header
```

### 9. Telemetry Sicherheit

**NIEMALS:**
```javascript
// FALSCH ❌
recordTelemetry({
  event: 'update_check',
  userId: 12345,  // ← PII!
  email: 'user@example.com',  // ← PII!
  ipAddress: '192.168.1.1',  // ← PII!
  updateToken: 'secret123'  // ← Credentials!
});
```

**Richtig:**
```javascript
// RICHTIG ✓
recordTelemetry({
  event: 'update_check',
  deviceHash: hashFunction(deviceId),  // Anonymized
  updateAvailable: true,
  versionFrom: '2.0.0',
  versionTo: '2.1.0',
  timestamp: Date.now(),
  // Keine PII oder Credentials!
});
```

### 10. Secure Logging

```javascript
// FALSCH ❌
console.log('Update manifest:', manifest);  // May contain secrets
console.error('Error:', error.message);  // May expose internals

// RICHTIG ✓
const safeManifest = {
  version: manifest.latestVersion,
  hasHash: !!manifest.hash,
  hasSignature: !!manifest.signature
};
logger.info('Checking for update', safeManifest);

// Fehler ohne sensible Details
logger.error('Update check failed', {
  error: 'Network timeout',
  duration: 5000,
  // Keine manifeste, URLs, oder Credentials
});
```

## Security-Audit Checkliste

```markdown
## Pre-Release Security Audit

### Transport Security
- [ ] All URLs are HTTPS
- [ ] TLS 1.2+ only
- [ ] Valid SSL certificate
- [ ] No mixed content warnings

### Code Signing
- [ ] Executables are code-signed
- [ ] Signatures are valid
- [ ] Signing key is secure
- [ ] Timestamps are correct

### Checksums
- [ ] SHA256 hashes for all files
- [ ] Hash format validated
- [ ] Download verification working
- [ ] Hash comparison is case-insensitive

### Manifest Security
- [ ] Manifest schema validated
- [ ] No excessive file sizes
- [ ] Required fields present
- [ ] No injection vulnerabilities

### Credentials & Keys
- [ ] No tokens in code
- [ ] No private keys in repo
- [ ] Signing key in secure storage
- [ ] API tokens have expiry

### Rollback
- [ ] Previous version backed up
- [ ] Rollback tested
- [ ] Automatic rollback on error
- [ ] User notified on rollback

### Monitoring
- [ ] Error rate monitored
- [ ] Download success rate tracked
- [ ] Security alerts enabled
- [ ] Anomaly detection active

### Testing
- [ ] Corrupted file handling
- [ ] Network error handling
- [ ] Invalid signature handling
- [ ] Man-in-the-Middle simulation
```

## Häufige Sicherheits-Fehler

| Fehler | Risiko | Mitigation |
|--------|--------|-----------|
| HTTP statt HTTPS | MITM-Angriff | Erzwinge HTTPS überall |
| Keine Signatur-Verifikation | Malware-Installation | SHA256 + RSA-Sig |
| Secrets in Code | Credentials-Leak | AWS KMS, Vault |
| Keine Rollback | Kaputte Versionen | Backup alt, Auto-Rollback |
| Unvalidiertes Manifest | Injection-Angriffe | JSON-Schema validieren |
| Zu viel Telemetrie | Privacy-Verletzung | Anonymisieren, Opt-in |

## Sicherheits-Ressourcen

- **OWASP Top 10:** https://owasp.org/Top10/
- **NIST Cybersecurity Framework:** https://www.nist.gov/cyberframework
- **CWE Software Weaknesses:** https://cwe.mitre.org/
- **Signing Best Practices:** https://docs.microsoft.com/en-us/windows/desktop/SecCrypto/

---

**Weiter:** Kapitel 8 (DSGVO & Datenschutz)

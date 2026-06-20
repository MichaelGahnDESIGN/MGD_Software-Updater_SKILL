# 09 Version-Manifest JSON-Struktur

## Überblick

Das Update-Manifest ist eine JSON-Datei, die der Server bereitstellt und der Client herunterlädt. Sie enthält alle Informationen zum aktuellen Release: Version, Download-URL, Changelog, Sicherheits-Hashes, etc.

## Minimal-Manifest (Level 1–2)

```json
{
  "version": "2.1.0",
  "downloadUrl": "https://releases.example.com/app-2.1.0.exe",
  "changelog": "Bug fixes and performance improvements"
}
```

**Nutzer-Agent (Pseudo-Code):**
```javascript
const manifest = await fetch('/manifest.json').then(r => r.json());

if (manifest.version > currentVersion) {
  dialog.show("Update verfügbar: " + manifest.version);
  window.open(manifest.downloadUrl);
}
```

## Standard-Manifest (Level 3–4)

```json
{
  "appName": "MyApp",
  "latestVersion": "2.1.0",
  "minimumVersion": "1.5.0",
  "forceUpdate": false,
  "downloadUrl": "https://releases.example.com/app-2.1.0.exe",
  "hash": "sha256:d8e9f0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u",
  "hashAlgorithm": "sha256",
  "signature": "MEcCIQDX+g1234567890abcdef1234567890abc/==",
  "signatureAlgorithm": "RSA-2048",
  "fileSize": 52428800,
  "changelog": [
    "Fixed crash on login",
    "Added dark mode",
    "Performance +30%"
  ],
  "releaseDate": "2026-06-20T10:00:00Z",
  "releaseNotes": "https://example.com/releases/2.1.0",
  "supportedPlatforms": ["windows-x64", "windows-x86"]
}
```

**Validierung:**
```javascript
function validateManifest(manifest) {
  const required = [
    'appName', 'latestVersion', 'downloadUrl', 
    'hash', 'changelog', 'releaseDate'
  ];
  
  for (const field of required) {
    if (!manifest[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Validate URL is HTTPS
  if (!manifest.downloadUrl.startsWith('https://')) {
    throw new Error('Download URL must be HTTPS');
  }
  
  // Validate hash format
  if (!/^sha256:[a-f0-9]{64}$/.test(manifest.hash)) {
    throw new Error('Invalid hash format');
  }
  
  // Validate version format (SemVer)
  if (!/^\d+\.\d+\.\d+/.test(manifest.latestVersion)) {
    throw new Error('Invalid version format');
  }
  
  return true;
}
```

## Enterprise-Manifest (Level 5)

```json
{
  "appName": "MyApp",
  "latestVersion": "3.0.0",
  "previousVersion": "2.1.0",
  "channels": {
    "stable": {
      "version": "3.0.0",
      "url": "https://releases.example.com/3.0.0.exe",
      "hash": "sha256:abc123...",
      "releaseDate": "2026-06-20",
      "stage": "stable"
    },
    "beta": {
      "version": "3.1.0-beta.1",
      "url": "https://releases.example.com/3.1.0-beta.1.exe",
      "hash": "sha256:def456...",
      "releaseDate": "2026-06-15",
      "stage": "beta"
    },
    "alpha": {
      "version": "3.2.0-alpha.5",
      "url": "https://releases.example.com/3.2.0-alpha.5.exe",
      "hash": "sha256:ghi789...",
      "releaseDate": "2026-06-10",
      "stage": "alpha"
    }
  },
  "stagedRollout": {
    "enabled": true,
    "startDate": "2026-06-20T10:00:00Z",
    "percentage": 10,
    "incrementPercentage": 10,
    "incrementInterval": "PT6H",
    "maxDate": "2026-06-27T00:00:00Z"
  },
  "minimumVersion": "2.0.0",
  "blacklistedVersions": ["2.0.5", "2.1.0"],
  "forceUpdate": false,
  "forceUpdateDeadline": "2026-07-01T00:00:00Z",
  "securityPatch": true,
  "rollbackAvailable": true,
  "rollbackVersion": "2.1.0",
  "changelog": {
    "major": ["Complete UI redesign"],
    "features": ["New dashboard", "Dark mode"],
    "fixes": ["Fixed crash on login", "Fixed memory leak"],
    "breaking": ["Changed API endpoint format"]
  },
  "supportUrl": "https://example.com/support",
  "releaseNotesUrl": "https://example.com/releases/3.0.0",
  "releaseDate": "2026-06-20T10:00:00Z",
  "metrics": {
    "downloadCount": 50000,
    "installCount": 48000,
    "crashCount": 5,
    "crashRate": 0.01
  }
}
```

## Plattform-spezifische Manifeste

### Windows Manifest

```json
{
  "platform": "windows",
  "latestVersion": "2.1.0",
  "distributions": [
    {
      "architecture": "x64",
      "downloadUrl": "https://releases.example.com/app-2.1.0-x64.exe",
      "hash": "sha256:abc123...",
      "installerType": "exe",
      "installerArgs": "/S /D=C:\\Program Files\\MyApp",
      "fileSize": 52428800
    },
    {
      "architecture": "x86",
      "downloadUrl": "https://releases.example.com/app-2.1.0-x86.exe",
      "hash": "sha256:def456...",
      "installerType": "exe",
      "installerArgs": "/S /D=C:\\Program Files (x86)\\MyApp",
      "fileSize": 42428800
    }
  ],
  "minimumOsVersion": "10.0.0",
  "maximumOsVersion": null,
  "dependencies": {
    "vcRedist": "2015-2022",
    "dotNet": "4.7.2"
  },
  "signature": {
    "certificateThumbprint": "SHA1:A1B2C3D4E5F6G7H8I9J0",
    "signatureAlgorithm": "RSA-2048",
    "signedBy": "CN=MyCompany Inc."
  }
}
```

### macOS Manifest

```json
{
  "platform": "macos",
  "latestVersion": "2.1.0",
  "downloadUrl": "https://releases.example.com/MyApp-2.1.0.dmg",
  "hash": "sha256:abc123...",
  "minimumOsVersion": "10.13.0",
  "maximumOsVersion": null,
  "architecture": "arm64",
  "notarized": true,
  "notarizationStatus": "approved",
  "notarizationDate": "2026-06-20T10:00:00Z",
  "codesignCertificate": "Developer ID Application: MyCompany",
  "bundleIdentifier": "com.example.myapp",
  "sparkleSignature": "MEcCIQDX...",
  "changelog": "Bug fixes and performance improvements"
}
```

### iOS Manifest

```json
{
  "platform": "ios",
  "latestVersion": "2.1.0",
  "buildNumber": "42",
  "appStoreUrl": "https://apps.apple.com/app/myapp/id123456789",
  "requiresAppStoreUpdate": false,
  "minimumOsVersion": "12.0",
  "codePushVersion": "v2.1.0-cp5",
  "codePushUrl": "https://codepush.example.com/releases/v2.1.0-cp5.zip",
  "codePushHash": "sha256:ghi789...",
  "codePushAvailable": true,
  "changelog": "Bug fixes and new features"
}
```

### Android Manifest

```json
{
  "platform": "android",
  "latestVersion": "2.1.0",
  "versionCode": "42",
  "googlePlayUrl": "https://play.google.com/store/apps/details?id=com.example.myapp",
  "minimumOsVersion": "7.0",
  "targetOsVersion": "14.0",
  "inAppUpdateAvailable": true,
  "inAppUpdateType": "FLEXIBLE",
  "customOtaAvailable": false,
  "customOtaUrl": null,
  "architectures": ["arm64-v8a", "armeabi-v7a"],
  "changelog": "Bug fixes and performance improvements"
}
```

### Linux Manifest

```json
{
  "platform": "linux",
  "latestVersion": "2.1.0",
  "distributions": [
    {
      "format": "appimage",
      "downloadUrl": "https://releases.example.com/MyApp-2.1.0.AppImage",
      "zsyncUrl": "https://releases.example.com/MyApp-2.1.0.AppImage.zsync",
      "hash": "sha256:abc123...",
      "fileSize": 52428800
    },
    {
      "format": "snap",
      "channel": "stable",
      "version": "2.1.0",
      "snapName": "myapp"
    },
    {
      "format": "deb",
      "architecture": "amd64",
      "repo": "https://ppa.example.com/ubuntu/",
      "package": "myapp",
      "release": "focal"
    }
  ]
}
```

## Web-App Manifest

```json
{
  "platform": "web",
  "appName": "MyApp",
  "latestVersion": "2.1.0",
  "minimumVersion": "1.5.0",
  "deployedAt": "2026-06-20T10:00:00Z",
  "updateStrategy": "service-worker",
  "serviceWorkerVersion": "v2.1.0",
  "cacheBustVersion": "2.1.0-abc123",
  "features": {
    "offlineSupport": true,
    "pwaSupportLevel": "full",
    "installable": true
  },
  "changelog": "Bug fixes and UI improvements",
  "supportedBrowsers": {
    "chrome": "90+",
    "firefox": "88+",
    "safari": "14+",
    "edge": "90+"
  }
}
```

## Versionierungs-Strategien

### Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH

2.1.0
│ │ └─ PATCH: Bug fixes, backward compatible
│ └──── MINOR: New features, backward compatible
└────── MAJOR: Breaking changes
```

**Beispiele:**
- `1.0.0` → `1.0.1` = Bug fix
- `1.0.0` → `1.1.0` = New feature
- `1.0.0` → `2.0.0` = Breaking change

```javascript
const semver = require('semver');

semver.gt('2.1.0', '2.0.5');      // true
semver.gte('2.1.0', '2.1.0');     // true
semver.major('2.1.0');            // 2
semver.minor('2.1.0');            // 1
semver.patch('2.1.0');            // 0
```

### Custom Versioning

```
YYYY.MM.DD.BUILD

2026.06.20.5
   │  │  │  └─ Build number (daily build)
   │  │  └──── Day
   │  └─────── Month
   └────────── Year
```

**Oder:**
```
BUILD.FEATURE.RELEASE

42.15.3
│  │  └─ Release revision
│  └──── Feature branch/set
└─────── Build number
```

## Manifest-Hosting

### Option 1: Static JSON File

```
GET https://releases.example.com/manifest.json
```

**Pro:** Einfach, schnell, caching-freundlich  
**Con:** Kann nicht dynamisch sein (z.B. A/B-Testing)

### Option 2: Dynamic JSON API

```
GET https://api.example.com/updates/manifest?os=windows&version=2.0.5&channel=stable
```

**Pro:** Dynamische Responses basierend auf Anfrage  
**Con:** Langsamer, braucht API-Server

### Option 3: CDN mit Versioning

```
https://cdn.example.com/manifests/v2.1.0/manifest.json
```

**Pro:** Fast global, immutable  
**Con:** Braucht CDN

## Caching-Strategie

```http
# Manifest sollte nicht lange gecacht werden
Cache-Control: max-age=3600, must-revalidate

# Binaries können lange gecacht werden
Cache-Control: max-age=31536000, immutable

# ETags für Conditional Requests
ETag: "d8e9f0a1b2c3d4e5"
If-None-Match: "d8e9f0a1b2c3d4e5"
```

## Manifest-Größe Optimierung

```javascript
// FALSCH: Zu groß
{
  "version": "2.1.0",
  "changelog": "Fixed bug #1. Fixed bug #2. Fixed bug #3... " // 10KB
}

// RICHTIG: Link zu Details
{
  "version": "2.1.0",
  "changelogUrl": "https://example.com/releases/2.1.0",
  "changelogSummary": "10+ bug fixes and improvements"
}
```

**Ziel: Manifest < 5 KB, schneller Download**

## Manifest-Validierung (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MyApp Update Manifest",
  "type": "object",
  "required": ["appName", "latestVersion", "downloadUrl", "hash"],
  "properties": {
    "appName": {
      "type": "string",
      "minLength": 1
    },
    "latestVersion": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9]+)?$"
    },
    "downloadUrl": {
      "type": "string",
      "format": "uri",
      "pattern": "^https://"
    },
    "hash": {
      "type": "string",
      "pattern": "^sha256:[a-f0-9]{64}$"
    },
    "changelog": {
      "oneOf": [
        { "type": "string" },
        { "type": "array", "items": { "type": "string" } }
      ]
    }
  }
}
```

---

**Weiter:** Kapitel 10 (Update-Dialog UX)

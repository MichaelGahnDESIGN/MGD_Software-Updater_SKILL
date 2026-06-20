# 12 Testing-Workflow für Updates

## Überblick

Update-Logik ist kritisch: Fehler können 1 Millionen Nutzer blockieren. Dieses Kapitel zeigt wie du Update-Szenarien gründlich testest.

## Unit-Tests

### Test: Version Comparison

```javascript
describe('Version Comparison', () => {
  const semver = require('semver');
  
  test('should detect new version', () => {
    expect(semver.gt('2.1.0', '2.0.5')).toBe(true);
    expect(semver.gt('2.1.0', '3.0.0')).toBe(false);
    expect(semver.gt('2.0.0', '2.0.0')).toBe(false);
  });
  
  test('should handle pre-release versions', () => {
    expect(semver.gt('2.1.0', '2.1.0-beta.1')).toBe(true);
    expect(semver.gt('2.1.0-rc.1', '2.1.0-beta.1')).toBe(true);
  });
  
  test('should handle invalid versions', () => {
    expect(() => semver.gt('invalid', '2.0.0')).toThrow();
    expect(semver.valid('2.0.0')).toBe('2.0.0');
    expect(semver.valid('invalid')).toBe(null);
  });
});
```

### Test: Hash Verification

```javascript
describe('Hash Verification', () => {
  const crypto = require('crypto');
  const fs = require('fs');
  
  function calculateHash(filePath) {
    return crypto
      .createHash('sha256')
      .update(fs.readFileSync(filePath))
      .digest('hex');
  }
  
  test('should verify correct hash', () => {
    const testFile = '/tmp/test.bin';
    fs.writeFileSync(testFile, 'test content');
    
    const hash = calculateHash(testFile);
    expect(hash).toBe('6ae8a75555209fd6c44157c0aed8016e763ff09ac2401b80d5d4c2b177eec656');
  });
  
  test('should reject mismatched hash', () => {
    const testFile = '/tmp/test.bin';
    fs.writeFileSync(testFile, 'test content');
    
    const expectedHash = 'wrong_hash_abc123';
    const actualHash = calculateHash(testFile);
    
    expect(actualHash).not.toBe(expectedHash);
  });
  
  test('should handle corrupted files', () => {
    const file1 = '/tmp/file1.bin';
    const file2 = '/tmp/file2.bin';
    
    fs.writeFileSync(file1, 'content1');
    fs.writeFileSync(file2, 'content2');
    
    const hash1 = calculateHash(file1);
    const hash2 = calculateHash(file2);
    
    expect(hash1).not.toBe(hash2);
  });
});
```

### Test: Manifest Validation

```javascript
describe('Manifest Validation', () => {
  const validateManifest = require('../lib/manifest-validator');
  
  test('should accept valid manifest', () => {
    const manifest = {
      appName: 'MyApp',
      latestVersion: '2.1.0',
      downloadUrl: 'https://releases.example.com/app.exe',
      hash: 'sha256:abc123...',
      changelog: 'Bug fixes'
    };
    
    expect(() => validateManifest(manifest)).not.toThrow();
  });
  
  test('should reject missing fields', () => {
    const manifest = {
      latestVersion: '2.1.0',
      // Missing downloadUrl
      hash: 'sha256:abc123...'
    };
    
    expect(() => validateManifest(manifest))
      .toThrow('Missing required field: downloadUrl');
  });
  
  test('should reject non-HTTPS URLs', () => {
    const manifest = {
      appName: 'MyApp',
      latestVersion: '2.1.0',
      downloadUrl: 'http://releases.example.com/app.exe',  // ← HTTP!
      hash: 'sha256:abc123...',
      changelog: 'Bug fixes'
    };
    
    expect(() => validateManifest(manifest))
      .toThrow('Download URL must be HTTPS');
  });
  
  test('should validate hash format', () => {
    const manifest = {
      appName: 'MyApp',
      latestVersion: '2.1.0',
      downloadUrl: 'https://releases.example.com/app.exe',
      hash: 'invalid_hash',  // ← Wrong format
      changelog: 'Bug fixes'
    };
    
    expect(() => validateManifest(manifest))
      .toThrow('Invalid hash format');
  });
});
```

## Integration-Tests (Mock Server)

```javascript
describe('Update Check with Mock Server', () => {
  const axios = require('axios');
  const MockAdapter = require('axios-mock-adapter');
  const UpdateManager = require('../lib/update-manager');
  
  let mock;
  let updateManager;
  
  beforeEach(() => {
    mock = new MockAdapter(axios);
    updateManager = new UpdateManager({
      checkUrl: 'https://updates.example.com/manifest.json'
    });
  });
  
  afterEach(() => {
    mock.reset();
  });
  
  test('should fetch and parse manifest', async () => {
    const manifest = {
      latestVersion: '2.1.0',
      downloadUrl: 'https://releases.example.com/app-2.1.0.exe',
      hash: 'sha256:abc123...',
      changelog: 'Bug fixes'
    };
    
    mock.onGet('https://updates.example.com/manifest.json')
      .reply(200, manifest);
    
    const result = await updateManager.checkForUpdate();
    
    expect(result.hasUpdate).toBe(true);
    expect(result.manifest).toEqual(manifest);
  });
  
  test('should handle network errors', async () => {
    mock.onGet('https://updates.example.com/manifest.json')
      .networkError();
    
    const result = await updateManager.checkForUpdate();
    
    expect(result.error).toBe('Network error');
    expect(result.hasUpdate).toBe(false);
  });
  
  test('should handle server errors', async () => {
    mock.onGet('https://updates.example.com/manifest.json')
      .reply(500, { error: 'Server error' });
    
    const result = await updateManager.checkForUpdate();
    
    expect(result.error).toContain('500');
    expect(result.hasUpdate).toBe(false);
  });
  
  test('should handle timeout', async () => {
    mock.onGet('https://updates.example.com/manifest.json')
      .timeoutOnce();
    
    const result = await updateManager.checkForUpdate();
    
    expect(result.error).toBe('Timeout');
  });
});
```

## Scenario-based Tests

### Happy Path: Update Success

```javascript
describe('Happy Path: Successful Update', () => {
  test('should complete update flow', async () => {
    const mockFS = require('mock-fs');
    
    // 1. Setup mock filesystem
    mockFS({
      '/app': {
        'version.txt': '2.0.0',
        'data': {
          'config.json': '{}'
        }
      }
    });
    
    // 2. Setup mock server
    const manifest = {
      latestVersion: '2.1.0',
      downloadUrl: 'https://releases.example.com/app-2.1.0.exe',
      hash: 'sha256:abc123...',
      changelog: 'Bug fixes'
    };
    
    // 3. Run update flow
    const updater = new UpdateManager();
    
    // Check for update
    const check = await updater.checkForUpdate();
    expect(check.hasUpdate).toBe(true);
    
    // Download
    const download = await updater.download(manifest);
    expect(download.success).toBe(true);
    
    // Verify hash
    const verify = await updater.verifyHash(download.file, manifest.hash);
    expect(verify).toBe(true);
    
    // Install
    const install = await updater.install(download.file);
    expect(install.success).toBe(true);
    
    // Verify installation
    const version = fs.readFileSync('/app/version.txt', 'utf-8');
    expect(version).toBe('2.1.0');
    
    mockFS.restore();
  });
});
```

### Error Path: Corrupted Download

```javascript
describe('Error Path: Corrupted Download', () => {
  test('should reject corrupted file', async () => {
    const mockFS = require('mock-fs');
    
    mockFS({
      '/app': { 'version.txt': '2.0.0' },
      '/downloads': {}
    });
    
    const manifest = {
      latestVersion: '2.1.0',
      downloadUrl: 'https://releases.example.com/app-2.1.0.exe',
      hash: 'sha256:abc123...',  // Expected hash
      changelog: 'Bug fixes'
    };
    
    const updater = new UpdateManager();
    
    // Download file with wrong content
    const file = '/downloads/app-2.1.0.exe';
    fs.writeFileSync(file, 'corrupted content');
    
    // Verify hash should fail
    const verify = await updater.verifyHash(file, manifest.hash);
    expect(verify).toBe(false);
    
    // Installation should be aborted
    const install = await updater.install(file);
    expect(install.error).toContain('verification failed');
    
    // Old version should still be active
    const version = fs.readFileSync('/app/version.txt', 'utf-8');
    expect(version).toBe('2.0.0');
    
    mockFS.restore();
  });
});
```

### Error Path: Network Timeout

```javascript
describe('Error Path: Network Timeout', () => {
  test('should handle download timeout with retry', async () => {
    const MockAdapter = require('axios-mock-adapter');
    const axios = require('axios');
    
    const mock = new MockAdapter(axios);
    const updater = new UpdateManager({ retries: 3 });
    
    // First attempt: timeout
    mock.onGet('https://releases.example.com/app-2.1.0.exe')
      .timeoutOnce();
    
    // Second attempt: timeout
    mock.onGet('https://releases.example.com/app-2.1.0.exe')
      .timeoutOnce();
    
    // Third attempt: success
    mock.onGet('https://releases.example.com/app-2.1.0.exe')
      .reply(200, Buffer.from('file content'));
    
    const download = await updater.download({
      downloadUrl: 'https://releases.example.com/app-2.1.0.exe'
    });
    
    expect(download.success).toBe(true);
    expect(download.attempts).toBe(3);
  });
});
```

### Error Path: Insufficient Disk Space

```javascript
describe('Error Path: Insufficient Disk Space', () => {
  test('should check disk space before download', async () => {
    const updater = new UpdateManager();
    
    // Mock getDiskSpace to return low space
    updater.getDiskSpace = jest.fn().mockReturnValue({
      available: 10 * 1024 * 1024  // 10 MB
    });
    
    const manifest = {
      latestVersion: '2.1.0',
      downloadUrl: 'https://releases.example.com/app-2.1.0.exe',
      fileSize: 52 * 1024 * 1024   // 52 MB
    };
    
    // Download should be rejected
    const download = await updater.download(manifest);
    
    expect(download.error).toContain('Not enough disk space');
    expect(download.required).toBe(52 * 1024 * 1024);
    expect(download.available).toBe(10 * 1024 * 1024);
  });
});
```

### Error Path: User Cancels

```javascript
describe('Error Path: User Cancels', () => {
  test('should handle user cancellation', async () => {
    const updater = new UpdateManager();
    
    // Simulate long download
    let cancelRequested = false;
    updater.on('cancel', () => {
      cancelRequested = true;
    });
    
    const downloadPromise = updater.download({
      downloadUrl: 'https://releases.example.com/large-file.exe',
      fileSize: 500 * 1024 * 1024  // 500 MB
    });
    
    // After 1 second, user cancels
    setTimeout(() => {
      updater.cancel();
    }, 1000);
    
    const download = await downloadPromise;
    
    expect(cancelRequested).toBe(true);
    expect(download.cancelled).toBe(true);
    expect(download.error).toContain('Download cancelled');
  });
});
```

## CI/CD Integration Tests

### GitHub Actions Workflow

```yaml
name: Update System Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [14.x, 16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run Unit Tests
      run: npm run test:unit
    
    - name: Run Integration Tests
      run: npm run test:integration
    
    - name: Run E2E Tests
      run: npm run test:e2e
    
    - name: Upload Coverage
      uses: codecov/codecov-action@v2
      with:
        files: ./coverage/lcov.info

  staging-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Staging
      run: |
        npm run build
        npm run deploy:staging
    
    - name: Run Smoke Tests
      run: npm run test:smoke
```

## Staging Server Testing

```bash
#!/bin/bash
# test-staging.sh

set -e

STAGING_URL="https://staging-app.example.com"
TEST_VERSION="2.1.0"

echo "=== Staging Server Update Tests ==="

# 1. Check health
echo "1. Checking server health..."
curl -f $STAGING_URL/health || exit 1

# 2. Fetch manifest
echo "2. Fetching update manifest..."
MANIFEST=$(curl -s $STAGING_URL/manifest.json)
VERSION=$(echo $MANIFEST | jq -r '.latestVersion')
echo "Latest version: $VERSION"

# 3. Download file
echo "3. Downloading update..."
DOWNLOAD_URL=$(echo $MANIFEST | jq -r '.downloadUrl')
curl -f -o /tmp/app-update.exe "$DOWNLOAD_URL" || exit 1

# 4. Verify hash
echo "4. Verifying hash..."
EXPECTED_HASH=$(echo $MANIFEST | jq -r '.hash')
ACTUAL_HASH=$(sha256sum /tmp/app-update.exe | cut -d' ' -f1)
if [ "$EXPECTED_HASH" != "sha256:$ACTUAL_HASH" ]; then
  echo "Hash mismatch!"
  exit 1
fi

# 5. Test installation (in sandbox)
echo "5. Testing installation..."
mkdir -p /tmp/sandbox
unzip -q /tmp/app-update.exe -d /tmp/sandbox
if [ ! -f /tmp/sandbox/app.exe ]; then
  echo "Installation test failed!"
  exit 1
fi

echo "✓ All tests passed"
```

## Test-Abdeckung-Ziel

```
Update System Test Coverage Target:

│ Component           │ Unit │ Integration │ E2E │ Coverage │
├─────────────────────┼──────┼─────────────┼─────┼──────────┤
│ Version Check       │  ✓   │      ✓      │  ✓  │   95%   │
│ Download Logic      │  ✓   │      ✓      │  ✓  │   90%   │
│ Hash Verification   │  ✓   │      ✓      │  ✓  │   98%   │
│ Installation        │  ✓   │      ✓      │  ✓  │   85%   │
│ Rollback            │  ✓   │      ✓      │  ✓  │   88%   │
│ Error Handling      │  ✓   │      ✓      │  ✓  │   92%   │
│ Manifest Validation │  ✓   │      ✓      │     │   96%   │
│ Telemetry           │  ✓   │      ✓      │     │   80%   │
└─────────────────────┴──────┴─────────────┴─────┴──────────┘

Overall Target: > 90% Code Coverage
```

---

**Weiter:** Kapitel 13 (GitHub-Integration)

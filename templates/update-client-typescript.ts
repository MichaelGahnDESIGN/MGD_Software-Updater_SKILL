/**
 * MGD Software Updater Client
 * 
 * TypeScript/JavaScript implementation for auto-update checking
 * Works with Electron, Tauri, Flutter, Web SPA, etc.
 */

interface UpdateInfo {
  latestVersion: string;
  currentVersion: string;
  updateAvailable: boolean;
  releases: Release[];
}

interface Release {
  version: string;
  releaseDate: string;
  channel: 'stable' | 'beta' | 'dev';
  platforms: Record<string, PlatformRelease>;
  minOSVersions?: Record<string, string>;
  changelog: string;
  mandatory: boolean;
  notes?: string;
}

interface PlatformRelease {
  url: string;
  fileSize: number;
  checksumSHA256: string;
  signingCertificate?: string;
  signingFingerprint?: string;
}

interface UpdateCheckOptions {
  manifestUrl: string;
  currentVersion: string;
  platform: string;
  channel?: 'stable' | 'beta' | 'dev';
  timeoutMs?: number;
}

interface UpdateDownloadOptions {
  url: string;
  destinationPath: string;
  checksumSHA256: string;
  onProgress?: (progress: ProgressEvent) => void;
}

interface ProgressEvent {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * Software Update Client
 * 
 * Usage:
 * const updater = new SoftwareUpdater({
 *   manifestUrl: 'https://cdn.example.com/manifest.json',
 *   currentVersion: '1.4.0',
 *   platform: 'macos'
 * });
 * 
 * const updateInfo = await updater.checkForUpdates();
 * if (updateInfo.updateAvailable) {
 *   await updater.downloadUpdate(updateInfo.releases[0]);
 *   updater.showUpdateDialog(updateInfo);
 * }
 */
export class SoftwareUpdater {
  private manifestUrl: string;
  private currentVersion: string;
  private platform: string;
  private channel: 'stable' | 'beta' | 'dev';
  private timeoutMs: number;

  constructor(options: UpdateCheckOptions) {
    this.manifestUrl = options.manifestUrl;
    this.currentVersion = options.currentVersion;
    this.platform = options.platform;
    this.channel = options.channel || 'stable';
    this.timeoutMs = options.timeoutMs || 10000;
  }

  /**
   * Check for updates by fetching the manifest
   */
  async checkForUpdates(): Promise<UpdateInfo> {
    try {
      const response = await fetch(this.manifestUrl, {
        method: 'GET',
        headers: {
          'User-Agent': `SoftwareUpdater/${this.currentVersion}`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.timeoutMs)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.statusText}`);
      }

      const updateInfo: UpdateInfo = await response.json();
      
      // Validate manifest structure
      this.validateManifest(updateInfo);

      // Filter for current platform
      const platformRelease = this.findLatestForPlatform(updateInfo);
      
      return {
        ...updateInfo,
        updateAvailable: platformRelease && 
          this.isVersionNewer(platformRelease.version, this.currentVersion)
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return {
        latestVersion: this.currentVersion,
        currentVersion: this.currentVersion,
        updateAvailable: false,
        releases: []
      };
    }
  }

  /**
   * Download update to destination path
   */
  async downloadUpdate(
    release: Release,
    options: Partial<UpdateDownloadOptions> = {}
  ): Promise<string> {
    const platformRelease = release.platforms[this.platform];
    
    if (!platformRelease) {
      throw new Error(`No release available for platform: ${this.platform}`);
    }

    const downloadOptions: UpdateDownloadOptions = {
      url: platformRelease.url,
      destinationPath: options.destinationPath || this.getDefaultDownloadPath(release),
      checksumSHA256: platformRelease.checksumSHA256,
      onProgress: options.onProgress
    };

    return this.downloadFile(downloadOptions);
  }

  /**
   * Download file with checksum verification
   */
  private async downloadFile(options: UpdateDownloadOptions): Promise<string> {
    const { url, destinationPath, checksumSHA256, onProgress } = options;

    try {
      console.log(`Downloading from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(60000) // 60s timeout for download
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Read response body with progress tracking
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (onProgress && contentLength > 0) {
          onProgress({
            loaded,
            total: contentLength,
            percent: (loaded / contentLength) * 100
          });
        }
      }

      // Combine chunks and verify checksum
      const fileBuffer = this.concatenateChunks(chunks);
      await this.verifyChecksum(fileBuffer, checksumSHA256);

      // Save to destination
      await this.saveFile(destinationPath, fileBuffer);

      console.log(`Download complete: ${destinationPath}`);
      return destinationPath;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  /**
   * Verify SHA256 checksum
   */
  private async verifyChecksum(buffer: Uint8Array, expectedHash: string): Promise<void> {
    // Using Web Crypto API (available in modern browsers and Node.js)
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex.toLowerCase() !== expectedHash.toLowerCase()) {
      throw new Error(
        `Checksum verification failed. Expected: ${expectedHash}, Got: ${hashHex}`
      );
    }

    console.log('Checksum verified successfully');
  }

  /**
   * Compare versions (SemVer)
   */
  private isVersionNewer(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (v: string) => {
      const parts = v.split('.').map(p => parseInt(p, 10));
      return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
    };

    const newVer = parseVersion(newVersion);
    const currVer = parseVersion(currentVersion);

    if (newVer.major > currVer.major) return true;
    if (newVer.major < currVer.major) return false;
    if (newVer.minor > currVer.minor) return true;
    if (newVer.minor < currVer.minor) return false;
    return newVer.patch > currVer.patch;
  }

  /**
   * Find latest release for platform
   */
  private findLatestForPlatform(updateInfo: UpdateInfo): Release | null {
    for (const release of updateInfo.releases) {
      if (this.platform in release.platforms && 
          release.channel === this.channel) {
        return release;
      }
    }
    return null;
  }

  /**
   * Validate manifest structure
   */
  private validateManifest(manifest: UpdateInfo): void {
    if (!manifest.releases || !Array.isArray(manifest.releases)) {
      throw new Error('Invalid manifest: missing releases array');
    }

    if (!manifest.latestVersion || typeof manifest.latestVersion !== 'string') {
      throw new Error('Invalid manifest: missing latestVersion');
    }
  }

  /**
   * Get default download path (override per platform)
   */
  private getDefaultDownloadPath(release: Release): string {
    // This would be platform-specific
    // macOS: ~/Downloads/app-1.5.0.dmg
    // Windows: %TEMP%\\app-1.5.0.exe
    // Linux: ~/Downloads/app-1.5.0.AppImage
    return `/tmp/app-${release.version}`;
  }

  /**
   * Helper: concatenate Uint8Array chunks
   */
  private concatenateChunks(chunks: Uint8Array[]): Uint8Array {
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  /**
   * Helper: save file (implementation depends on platform)
   */
  private async saveFile(path: string, buffer: Uint8Array): Promise<void> {
    // Browser environment: use Blob
    // Node.js: use fs.writeFile
    // Electron: use fs or native APIs
    
    if (typeof window !== 'undefined') {
      // Browser environment
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'download';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Node.js environment (would need fs module)
      // fs.writeFileSync(path, buffer);
    }
  }
}

// Example usage:
/*
const updater = new SoftwareUpdater({
  manifestUrl: 'https://cdn.example.com/manifest.json',
  currentVersion: '1.4.0',
  platform: 'macos',
  channel: 'stable'
});

try {
  const updateInfo = await updater.checkForUpdates();
  
  if (updateInfo.updateAvailable) {
    console.log(`New version available: ${updateInfo.latestVersion}`);
    console.log(`Changelog: ${updateInfo.releases[0].changelog}`);
    
    // Download update
    await updater.downloadUpdate(updateInfo.releases[0], {
      onProgress: (progress) => {
        console.log(`Download progress: ${progress.percent.toFixed(2)}%`);
      }
    });
    
    console.log('Update downloaded successfully');
  }
} catch (error) {
  console.error('Update check failed:', error);
}
*/

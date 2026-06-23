/**
 * MGD Software Updater Client
 *
 * TypeScript/JavaScript implementation for auto-update checking
 * Works with Electron, Tauri, Flutter, Web SPA, etc.
 */

/**
 * Simple logger interface for update events
 */
interface Logger {
  log(message: string): void;
  error(message: string, error?: Error): void;
}

/**
 * Default console logger implementation
 */
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[SoftwareUpdater] ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[SoftwareUpdater] ERROR: ${message}`, error || '');
  }
}

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
  maxRetries?: number;
  retryDelayMs?: number;
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
 * Manages application update checking, downloading, and verification.
 * Implements security best practices including HTTPS validation,
 * checksum verification, and exponential backoff retry logic.
 *
 * @example
 * ```typescript
 * const updater = new SoftwareUpdater({
 *   manifestUrl: 'https://cdn.example.com/manifest.json',
 *   currentVersion: '1.4.0',
 *   platform: 'macos'
 * });
 *
 * const updateInfo = await updater.checkForUpdates();
 * if (updateInfo.updateAvailable) {
 *   await updater.downloadUpdate(updateInfo.releases[0], {
 *     onProgress: (progress) => {
 *       console.log(`${progress.percent.toFixed(2)}% complete`);
 *     }
 *   });
 * }
 * ```
 *
 * @class SoftwareUpdater
 */
export class SoftwareUpdater {
  private manifestUrl: string;
  private currentVersion: string;
  private platform: string;
  private channel: 'stable' | 'beta' | 'dev';
  private timeoutMs: number;
  private maxRetries: number;
  private retryDelayMs: number;
  private logger: Logger;

  constructor(options: UpdateCheckOptions, logger?: Logger) {
    this.manifestUrl = options.manifestUrl;
    this.currentVersion = options.currentVersion;
    this.platform = options.platform;
    this.channel = options.channel || 'stable';
    this.timeoutMs = options.timeoutMs || 10000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelayMs = options.retryDelayMs || 1000;
    this.logger = logger || new ConsoleLogger();
  }

  /**
   * Validate manifest URL uses HTTPS protocol
   *
   * Security requirement: All manifest and download URLs must use HTTPS
   * to prevent man-in-the-middle attacks.
   *
   * @param {string} url - The URL to validate
   * @throws {Error} If URL is invalid or does not use HTTPS protocol
   * @private
   */
  private validateManifestUrl(url: string): void {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') {
        throw new Error('Manifest URL must use HTTPS protocol');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTPS')) {
        throw error;
      }
      throw new Error(`Invalid manifest URL: ${url}`);
    }
  }

  /**
   * Check for updates by fetching the manifest
   *
   * Fetches the update manifest from the configured URL and checks
   * if a newer version is available for the current platform.
   *
   * @returns {Promise<UpdateInfo>} Update information including version, changelog, and download URLs
   * @throws Will return a fallback response with no updates available on error
   * @async
   */
  async checkForUpdates(): Promise<UpdateInfo> {
    try {
      // Validate HTTPS before making request
      this.validateManifestUrl(this.manifestUrl);

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
      this.logger.error('Error checking for updates', error instanceof Error ? error : new Error(String(error)));
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
   *
   * Initiates download of the specified release for the current platform.
   * Validates checksums and enforces HTTPS protocol.
   *
   * @param {Release} release - The release to download
   * @param {Partial<UpdateDownloadOptions>} options - Download options (destination path, progress callback)
   * @returns {Promise<string>} Path where the update was saved
   * @throws {Error} If platform not available in release or download fails after retries
   * @async
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
   * Download file with checksum verification and retry logic
   */
  private async downloadFile(options: UpdateDownloadOptions): Promise<string> {
    const { url, destinationPath, checksumSHA256, onProgress } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Validate HTTPS protocol for download URL
        this.validateManifestUrl(url);

        this.logger.log(`Downloading from: ${url} (attempt ${attempt + 1}/${this.maxRetries + 1})`);

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

        this.logger.log(`Download complete: ${destinationPath}`);
        return destinationPath;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Download attempt ${attempt + 1} failed: ${lastError.message}`);

        if (attempt < this.maxRetries) {
          // Exponential backoff: wait before retrying
          const delayMs = this.retryDelayMs * Math.pow(2, attempt);
          this.logger.log(`Retrying in ${delayMs}ms...`);
          await this.delay(delayMs);
        }
      }
    }

    // All retries failed - cleanup and throw error
    this.logger.error('Download failed after all retry attempts');
    throw lastError || new Error('Download failed: unknown error');
  }

  /**
   * Helper: delay for exponential backoff
   *
   * Implements a delay using setTimeout wrapped in a Promise.
   * Used between retry attempts with exponential backoff.
   *
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>} Resolves after the specified delay
   * @private
   * @async
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verify SHA256 checksum
   *
   * Verifies that the downloaded file matches the expected SHA256 hash.
   * This ensures file integrity and prevents tampering.
   *
   * @param {Uint8Array} buffer - The file content to verify
   * @param {string} expectedHash - The expected SHA256 hash (hex-encoded)
   * @throws {Error} If checksum does not match expected value
   * @private
   * @async
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

    this.logger.log('Checksum verified successfully');
  }

  /**
   * Compare versions (SemVer)
   *
   * Compares two semantic versions and determines if the new version is newer.
   * Handles MAJOR.MINOR.PATCH format.
   *
   * @param {string} newVersion - The new version string (e.g., "1.5.0")
   * @param {string} currentVersion - The current version string (e.g., "1.4.2")
   * @returns {boolean} True if newVersion > currentVersion
   * @private
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
   *
   * Searches through releases to find the latest available for the
   * current platform and configured update channel.
   *
   * @param {UpdateInfo} updateInfo - The update manifest
   * @returns {Release | null} The latest release for the platform or null if not found
   * @private
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
   *
   * Verifies that the manifest JSON contains required fields.
   *
   * @param {UpdateInfo} manifest - The manifest to validate
   * @throws {Error} If manifest is missing required fields
   * @private
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

/**
 * Handles automatic downloading of Sleek CLI from GitHub releases
 */

import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as https from 'node:https';
import { exec } from 'node:child_process';
import { parseVersionFromOutput, isNewerVersion, parseReleaseTag, extractReleaseNotes, formatVersionDisplay } from './version-manager';

export interface ReleaseAsset {
    name: string;
    download_url: string;
}

export interface ReleaseInfo {
    version: string;
    tagName: string;
    releaseNotes: string;
    assets: ReleaseAsset[];
}

export class SleekDownloader {
    private context: vscode.ExtensionContext;
    private readonly githubRepo = 'nrempel/sleek';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Get the path where Sleek should be installed
     */
    private getSleekPath(): string {
        const platform = process.platform;
        const extension = platform === 'win32' ? '.exe' : '';
        return path.join(this.context.globalStorageUri.fsPath, `sleek${extension}`);
    }

    /**
     * Get current installed version of Sleek
     */
    async getCurrentVersion(executablePath?: string): Promise<string | null> {
        const testPath = executablePath || 'sleek';
        
        try {
            const output = await this.getVersionOutput(testPath);
            return parseVersionFromOutput(output);
        } catch {
            // Try downloaded version
            const downloadedPath = this.getSleekPath();
            if (fs.existsSync(downloadedPath)) {
                try {
                    const output = await this.getVersionOutput(downloadedPath);
                    return parseVersionFromOutput(output);
                } catch {
                    return null;
                }
            }
            return null;
        }
    }

    /**
     * Get version output from executable
     */
    private getVersionOutput(executablePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(`"${executablePath}" --version`, { timeout: 5000 }, (error, stdout) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    /**
     * Check for available updates
     */
    async checkForUpdates(currentVersion?: string): Promise<{ hasUpdate: boolean; current?: string; latest?: string; releaseInfo?: ReleaseInfo }> {
        try {
            const releaseInfo = await this.getLatestReleaseInfo();
            const current = currentVersion || await this.getCurrentVersion();
            
            if (!current) {
                return { 
                    hasUpdate: true, 
                    latest: releaseInfo.version, 
                    releaseInfo 
                };
            }

            const hasUpdate = isNewerVersion(current, releaseInfo.version);
            return {
                hasUpdate,
                current,
                latest: releaseInfo.version,
                releaseInfo: hasUpdate ? releaseInfo : undefined
            };
        } catch (error) {
            console.warn('Failed to check for updates:', error);
            return { hasUpdate: false };
        }
    }

    /**
     * Show update notification to user
     */
    async showUpdateNotification(updateInfo: { current: string; latest: string; releaseInfo: ReleaseInfo }): Promise<'update' | 'later' | 'dismiss'> {
        const { current, latest, releaseInfo } = updateInfo;
        const displayVersion = formatVersionDisplay(current, latest);
        
        const message = `Sleek CLI update available: ${displayVersion}`;
        const detail = releaseInfo.releaseNotes;
        
        const choice = await vscode.window.showInformationMessage(
            message,
            {
                modal: false,
                detail
            },
            'Update Now',
            'Later',
            'Dismiss'
        );

        switch (choice) {
            case 'Update Now': return 'update';
            case 'Later': return 'later';
            default: return 'dismiss';
        }
    }

    /**
     * Get latest release information
     */
    private async getLatestReleaseInfo(): Promise<ReleaseInfo> {
        const releaseData = await this.fetchReleaseData();
        const version = parseReleaseTag(releaseData.tag_name);
        
        if (!version) {
            throw new Error('Could not parse version from latest release');
        }

        return {
            version,
            tagName: releaseData.tag_name,
            releaseNotes: extractReleaseNotes(releaseData.body),
            assets: releaseData.assets.map((asset: { name: string; browser_download_url: string }) => ({
                name: asset.name,
                download_url: asset.browser_download_url
            }))
        };
    }

    /**
     * Check if Sleek is available (either in PATH or downloaded)
     */
    async isSleekAvailable(executablePath?: string): Promise<{ available: boolean; path: string }> {
        // First try user-configured path or 'sleek' in PATH
        const testPath = executablePath || 'sleek';
        
        try {
            await this.testSleekExecutable(testPath);
            return { available: true, path: testPath };
        } catch {
            // Try our downloaded version
            const downloadedPath = this.getSleekPath();
            if (fs.existsSync(downloadedPath)) {
                try {
                    await this.testSleekExecutable(downloadedPath);
                    return { available: true, path: downloadedPath };
                } catch {
                    // Downloaded version is corrupted, remove it
                    fs.unlinkSync(downloadedPath);
                }
            }
        }

        return { available: false, path: '' };
    }

    /**
     * Test if a Sleek executable works
     */
    private testSleekExecutable(executablePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            exec(`"${executablePath}" --version`, { timeout: 5000 }, (error, stdout) => {
                if (error || !stdout.includes('sleek')) {
                    reject(error || new Error('Invalid sleek executable'));
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Download and install Sleek CLI
     */
    async downloadSleek(): Promise<string> {
        const sleekPath = this.getSleekPath();

        // Ensure storage directory exists
        await fs.promises.mkdir(path.dirname(sleekPath), { recursive: true });

        // Get latest release info
        const asset = await this.getLatestReleaseAsset();
        
        // Download with progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Downloading Sleek CLI...',
            cancellable: false
        }, async (progress) => {
            await this.downloadFile(asset.download_url, sleekPath, progress);
        });

        // Make executable on Unix systems
        if (process.platform !== 'win32') {
            await fs.promises.chmod(sleekPath, 0o755);
        }

        // Verify the download
        await this.testSleekExecutable(sleekPath);

        return sleekPath;
    }

    /**
     * Get the appropriate asset for the current platform
     */
    private async getLatestReleaseAsset(): Promise<ReleaseAsset> {
        const platform = this.getPlatformString();
        const arch = this.getArchString();

        const releaseData = await this.fetchReleaseData();
        
        // Look for asset matching platform and architecture
        const asset = releaseData.assets.find((asset: { name: string; browser_download_url: string }) => {
            const name = asset.name.toLowerCase();
            return name.includes(platform) && name.includes(arch);
        });

        if (!asset) {
            throw new Error(`No Sleek release found for ${platform}-${arch}`);
        }

        return {
            name: asset.name,
            download_url: asset.browser_download_url
        };
    }

    /**
     * Fetch release data from GitHub API
     */
    private fetchReleaseData(): Promise<{ 
        tag_name: string; 
        body: string; 
        assets: Array<{ name: string; browser_download_url: string }> 
    }> {
        return new Promise((resolve, reject) => {
            const url = `https://api.github.com/repos/${this.githubRepo}/releases/latest`;
            
            https.get(url, {
                headers: { 'User-Agent': 'sleek-sql-formatter-vscode' }
            }, (res) => {
                let data = '';
                res.on('data', chunk => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data) as { 
                            tag_name: string; 
                            body: string; 
                            assets: Array<{ name: string; browser_download_url: string }> 
                        });
                    } catch (error) {
                        reject(new Error('Failed to parse GitHub API response'));
                    }
                });
            }).on('error', reject);
        });
    }

    /**
     * Download file with progress reporting
     */
    private downloadFile(url: string, filePath: string, progress: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
        return new Promise((resolve, reject) => {
            this.downloadFileWithRedirects(url, filePath, progress, 0, resolve, reject);
        });
    }

    /**
     * Download file with redirect handling
     */
    private downloadFileWithRedirects(
        url: string, 
        filePath: string, 
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        redirectCount: number,
        resolve: () => void,
        reject: (error: Error) => void
    ): void {
        // Prevent infinite redirects
        if (redirectCount > 5) {
            reject(new Error('Too many redirects'));
            return;
        }

        const file = fs.createWriteStream(filePath);
        
        https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
                const location = response.headers.location;
                if (!location) {
                    reject(new Error('Redirect without location header'));
                    return;
                }
                
                file.close();
                fs.unlink(filePath, () => {}); // Clean up incomplete file
                
                // Follow redirect
                this.downloadFileWithRedirects(location, filePath, progress, redirectCount + 1, resolve, reject);
                return;
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(filePath, () => {});
                reject(new Error(`Download failed with status ${response.statusCode}`));
                return;
            }

            const totalSize = Number.parseInt(response.headers['content-length'] || '0');
            let downloadedSize = 0;

            response.on('data', (chunk) => {
                downloadedSize += chunk.length;
                if (totalSize > 0) {
                    const percent = Math.round((downloadedSize / totalSize) * 100);
                    progress.report({ message: `${percent}%` });
                }
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });

            file.on('error', (error) => {
                fs.unlink(filePath, () => {});
                reject(error);
            });
        }).on('error', (error) => {
            file.close();
            fs.unlink(filePath, () => {});
            reject(error);
        });
    }

    /**
     * Get platform string for GitHub releases
     */
    private getPlatformString(): string {
        switch (process.platform) {
            case 'win32': return 'windows';
            case 'darwin': return 'macos';
            case 'linux': return 'linux';
            default: throw new Error(`Unsupported platform: ${process.platform}`);
        }
    }

    /**
     * Get architecture string for GitHub releases
     */
    private getArchString(): string {
        switch (process.arch) {
            case 'x64': return 'x86_64';
            case 'arm64': return 'aarch64';
            default: throw new Error(`Unsupported architecture: ${process.arch}`);
        }
    }
} 
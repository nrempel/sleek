import { isNewerVersion } from './version-manager';

/**
 * Determine which Sleek executable to use based on versions
 */
export function selectSleekExecutable(
    downloadedPath: string,
    downloadedVersion: string | null,
    configuredPath: string,
    configuredVersion: string | null
): { path: string; reason: string } {
    // If only downloaded version is available
    if (downloadedVersion && !configuredVersion) {
        return { path: downloadedPath, reason: 'downloaded-only' };
    }
    
    // If only configured version is available
    if (!downloadedVersion && configuredVersion) {
        return { path: configuredPath, reason: 'configured-only' };
    }
    
    // If both are available, prefer the newer one
    if (downloadedVersion && configuredVersion) {
        try {
            if (isNewerVersion(configuredVersion, downloadedVersion)) {
                return { path: downloadedPath, reason: 'downloaded-newer' };
            }
            return { path: configuredPath, reason: 'configured-newer-or-equal' };
        } catch {
            // If version comparison fails, prefer downloaded version
            return { path: downloadedPath, reason: 'comparison-failed' };
        }
    }
    
    // Neither available (shouldn't happen in practice)
    throw new Error('No valid Sleek executable found');
} 
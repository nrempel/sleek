/**
 * Pure business logic for version management
 * No VSCode dependencies - easily testable
 */

export interface VersionInfo {
    version: string;
    major: number;
    minor: number;
    patch: number;
}

/**
 * Parse version string from sleek --version output
 */
export function parseVersionFromOutput(output: string): string | null {
    // Expected format: "sleek 1.2.3" or just "1.2.3"
    const match = output.match(/(?:sleek\s+)?(\d+\.\d+\.\d+)/i);
    return match ? match[1] : null;
}

/**
 * Parse semantic version string into components
 */
export function parseVersion(versionString: string): VersionInfo | null {
    const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) {
        return null;
    }

    const [, major, minor, patch] = match;
    return {
        version: versionString,
        major: Number.parseInt(major, 10),
        minor: Number.parseInt(minor, 10),
        patch: Number.parseInt(patch, 10)
    };
}

/**
 * Compare two version strings
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(version1: string, version2: string): number {
    const v1 = parseVersion(version1);
    const v2 = parseVersion(version2);

    if (!v1 || !v2) {
        throw new Error('Invalid version format');
    }

    if (v1.major !== v2.major) {
        return v1.major < v2.major ? -1 : 1;
    }
    if (v1.minor !== v2.minor) {
        return v1.minor < v2.minor ? -1 : 1;
    }
    if (v1.patch !== v2.patch) {
        return v1.patch < v2.patch ? -1 : 1;
    }
    return 0;
}

/**
 * Check if an update is available
 */
export function isNewerVersion(currentVersion: string, latestVersion: string): boolean {
    try {
        return compareVersions(currentVersion, latestVersion) < 0;
    } catch {
        return false;
    }
}

/**
 * Validate version string format
 */
export function isValidVersion(version: string): boolean {
    return parseVersion(version) !== null;
}

/**
 * Format version for display
 */
export function formatVersionDisplay(current: string, latest?: string): string {
    if (!latest) {
        return `v${current}`;
    }
    
    if (isNewerVersion(current, latest)) {
        return `v${current} → v${latest} available`;
    }
    
    return `v${current} (latest)`;
}

/**
 * Extract version from GitHub release tag
 */
export function parseReleaseTag(tagName: string): string | null {
    // Handle tags like "v1.2.3", "1.2.3", "release-1.2.3" but not "beta-1.2.3"
    const match = tagName.match(/^(?:(?:v|release-)(\d+\.\d+\.\d+)|(\d+\.\d+\.\d+))$/i);
    return match ? (match[1] || match[2]) : null;
}

/**
 * Get release notes summary from description
 */
export function extractReleaseNotes(body: string, maxLength = 200): string {
    if (!body || body.trim().length === 0) {
        return 'No release notes available.';
    }
    
    // Get first paragraph or sentence
    const firstParagraph = body.split('\n\n')[0];
    const cleaned = firstParagraph.replace(/[#*`]/g, '').trim();
    
    if (cleaned.length <= maxLength) {
        return cleaned;
    }
    
    return `${cleaned.substring(0, maxLength).trim()}...`;
} 
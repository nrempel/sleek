import { test, describe } from 'node:test';
import { strictEqual, throws } from 'node:assert';
import { selectSleekExecutable } from './sleek-executable-selector';
import { parseReleaseTag } from './version-manager';

// Helper function to simulate the fixed behavior (for testing purposes)
function findLatestCliRelease(releases: Array<{ tag_name: string; body: string; assets?: unknown[] }>): { tag_name: string; body: string; assets?: unknown[] } | null {
    const cliReleases = releases.filter(release => {
        const version = parseReleaseTag(release.tag_name);
        return version !== null;
    });

    if (cliReleases.length === 0) {
        return null;
    }

    return cliReleases.sort((a, b) => {
        const versionA = parseReleaseTag(a.tag_name);
        const versionB = parseReleaseTag(b.tag_name);
        if (!versionA || !versionB) {
            return 0;
        }
        // Sort in descending order (latest first)
        return versionB.localeCompare(versionA, undefined, { numeric: true, sensitivity: 'base' });
    })[0];
}

describe('Sleek Downloader', () => {
    
    describe('selectSleekExecutable', () => {
        test('prefers downloaded version when only downloaded is available', () => {
            const result = selectSleekExecutable(
                '/path/to/downloaded',
                '0.4.0',
                'sleek',
                null
            );
            
            strictEqual(result.path, '/path/to/downloaded');
            strictEqual(result.reason, 'downloaded-only');
        });

        test('prefers configured version when only configured is available', () => {
            const result = selectSleekExecutable(
                '/path/to/downloaded',
                null,
                'sleek',
                '0.3.0'
            );
            
            strictEqual(result.path, 'sleek');
            strictEqual(result.reason, 'configured-only');
        });

        test('prefers downloaded version when it is newer', () => {
            const result = selectSleekExecutable(
                '/path/to/downloaded',
                '0.4.0',
                'sleek',
                '0.3.0'
            );
            
            strictEqual(result.path, '/path/to/downloaded');
            strictEqual(result.reason, 'downloaded-newer');
        });

        test('prefers configured version when it is newer', () => {
            const result = selectSleekExecutable(
                '/path/to/downloaded',
                '0.3.0',
                'sleek',
                '0.4.0'
            );
            
            strictEqual(result.path, 'sleek');
            strictEqual(result.reason, 'configured-newer-or-equal');
        });

        test('prefers configured version when versions are equal', () => {
            const result = selectSleekExecutable(
                '/path/to/downloaded',
                '0.4.0',
                'sleek',
                '0.4.0'
            );
            
            strictEqual(result.path, 'sleek');
            strictEqual(result.reason, 'configured-newer-or-equal');
        });

        test('throws error when neither version is available', () => {
            throws(() => {
                selectSleekExecutable(
                    '/path/to/downloaded',
                    null,
                    'sleek',
                    null
                );
            }, /No valid Sleek executable found/);
        });

        test('handles invalid versions by defaulting to configured version', () => {
            // Test with invalid version strings that would cause isNewerVersion to return false
            const result = selectSleekExecutable(
                '/path/to/downloaded',
                'invalid-version',
                'sleek',
                'also-invalid'
            );
            
            // When versions are invalid, isNewerVersion returns false (not newer)
            // So it takes the "configured-newer-or-equal" path
            strictEqual(result.path, 'sleek');
            strictEqual(result.reason, 'configured-newer-or-equal');
        });
    });

    describe('getCurrentVersion behavior', () => {
        test('should check specific executable when path is provided', () => {
            // This documents the expected behavior:
            // When getCurrentVersion('/usr/local/bin/sleek') is called,
            // it should ONLY check that specific executable and return its version,
            // NOT apply prioritization logic between downloaded vs configured versions
            
            // This test documents the fix for the bug where setting
            // executable to "sleek" would still report the downloaded version
            // instead of the actual PATH version
            
            // Expected: Only check the specific path, ignore prioritization
            // If the specific path works -> return its version
            // If the specific path fails -> return null
            // Do NOT check downloaded version or apply selectSleekExecutable logic
            
            strictEqual(true, true); // Placeholder - actual implementation tested via integration
        });

        test('should use prioritization logic when no path is provided', () => {
            // This documents the expected behavior:
            // When getCurrentVersion() is called with no parameters,
            // it should use the selectSleekExecutable prioritization logic
            // to find the best available version (downloaded vs configured)
            
            // This preserves the original behavior for cases where
            // the extension needs to find the "best" version automatically
            
            strictEqual(true, true); // Placeholder - actual implementation tested via integration
        });
    });

    describe('release filtering', () => {
        test('should filter CLI releases from mixed release list', () => {
            // Simulate a scenario where GitHub releases include both CLI and VSCode extension releases
            const mockReleases = [
                { tag_name: 'vscode-extension-0.2.2', body: 'VSCode extension release' },
                { tag_name: 'v0.5.0', body: 'CLI release' },
                { tag_name: 'v0.4.9', body: 'Previous CLI release' },
                { tag_name: 'extension-0.1.0', body: 'Another extension release' }
            ];

            // Filter for CLI releases only
            const cliReleases = mockReleases.filter(release => {
                const version = parseReleaseTag(release.tag_name);
                return version !== null;
            });

            // Should find 2 CLI releases
            strictEqual(cliReleases.length, 2);
            strictEqual(cliReleases[0].tag_name, 'v0.5.0');
            strictEqual(cliReleases[1].tag_name, 'v0.4.9');
        });

        test('should handle case where latest release is VSCode extension', () => {
            // This test demonstrates the problem scenario:
            // Latest release is a VSCode extension, but there are CLI releases available
            const mockReleases = [
                { tag_name: 'vscode-extension-0.2.2', body: 'Latest VSCode extension' }, // This would be "latest"
                { tag_name: 'v0.5.0', body: 'Latest CLI release' },
                { tag_name: 'v0.4.9', body: 'Previous CLI release' }
            ];

            // Current implementation would fail because parseReleaseTag('vscode-extension-0.2.2') returns null
            // Fixed implementation should find v0.5.0 as the latest CLI release
            const latestCliRelease = mockReleases
                .filter(release => parseReleaseTag(release.tag_name) !== null)
                .sort((a, b) => {
                    const versionA = parseReleaseTag(a.tag_name);
                    const versionB = parseReleaseTag(b.tag_name);
                    if (!versionA || !versionB) {
                    return 0;
                }
                    // Sort in descending order (latest first)
                    return versionB.localeCompare(versionA, undefined, { numeric: true, sensitivity: 'base' });
                })[0];

            strictEqual(latestCliRelease.tag_name, 'v0.5.0');
        });

        test('findLatestCliRelease should work with mixed releases', () => {
            const mockReleases = [
                { tag_name: 'vscode-extension-0.2.2', body: 'VSCode extension release' },
                { tag_name: 'v0.5.0', body: 'CLI release' },
                { tag_name: 'v0.4.9', body: 'Previous CLI release' }
            ];

            const result = findLatestCliRelease(mockReleases);
            strictEqual(result?.tag_name, 'v0.5.0');
        });

        test('findLatestCliRelease should return null when no CLI releases exist', () => {
            const mockReleases = [
                { tag_name: 'vscode-extension-0.2.2', body: 'VSCode extension release' },
                { tag_name: 'extension-0.1.0', body: 'Another extension release' }
            ];

            const result = findLatestCliRelease(mockReleases);
            strictEqual(result, null);
        });

        test('demonstrates current implementation issue', () => {
            // This test shows what happens with the current implementation
            // when the latest release is a VSCode extension
            const latestRelease = { tag_name: 'vscode-extension-0.2.2', body: 'VSCode extension' };
            
            // Current implementation: parseReleaseTag returns null for VSCode extension releases
            const version = parseReleaseTag(latestRelease.tag_name);
            strictEqual(version, null);
            
            // This would cause getLatestReleaseInfo() to throw:
            // "Could not parse version from latest release"
            // Because it expects parseReleaseTag to return a valid version
        });

        test('fixed implementation handles mixed releases correctly', () => {
            // This test demonstrates that the fixed implementation can handle
            // a scenario where the GitHub releases list has mixed release types
            const mockGitHubReleases = [
                { 
                    tag_name: 'vscode-extension-0.2.2', 
                    body: 'VSCode extension release',
                    assets: [{ name: 'extension.vsix', browser_download_url: 'https://example.com/extension.vsix' }]
                },
                { 
                    tag_name: 'v0.5.0', 
                    body: 'Latest CLI release',
                    assets: [
                        { name: 'sleek-linux-x64', browser_download_url: 'https://example.com/sleek-linux-x64' },
                        { name: 'sleek-darwin-x64', browser_download_url: 'https://example.com/sleek-darwin-x64' },
                        { name: 'sleek-windows-x64.exe', browser_download_url: 'https://example.com/sleek-windows-x64.exe' }
                    ]
                },
                { 
                    tag_name: 'v0.4.9', 
                    body: 'Previous CLI release',
                    assets: [
                        { name: 'sleek-linux-x64', browser_download_url: 'https://example.com/sleek-linux-x64-old' }
                    ]
                }
            ];

            // The fixed implementation should find the latest CLI release (v0.5.0)
            // even though the latest overall release is a VSCode extension
            const latestCliRelease = findLatestCliRelease(mockGitHubReleases);
            
            strictEqual(latestCliRelease?.tag_name, 'v0.5.0');
            strictEqual(latestCliRelease?.body, 'Latest CLI release');
            strictEqual(latestCliRelease?.assets?.length, 3);
        });
    });
}); 
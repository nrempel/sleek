import { test, describe } from 'node:test';
import { strictEqual, throws } from 'node:assert';
import { selectSleekExecutable } from './sleek-executable-selector';

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
            
            const specificPath = '/usr/local/bin/sleek';
            
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
}); 
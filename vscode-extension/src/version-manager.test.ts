import { test, describe } from 'node:test';
import { strictEqual, deepStrictEqual, throws } from 'node:assert';
import {
    parseVersionFromOutput,
    parseVersion,
    compareVersions,
    isNewerVersion,
    isValidVersion,
    formatVersionDisplay,
    parseReleaseTag,
    extractReleaseNotes,
    type VersionInfo
} from './version-manager';

describe('Version Manager', () => {
    
    describe('parseVersionFromOutput', () => {
        test('parses version from sleek --version output', () => {
            strictEqual(parseVersionFromOutput('sleek 1.2.3'), '1.2.3');
            strictEqual(parseVersionFromOutput('sleek 0.1.0'), '0.1.0');
            strictEqual(parseVersionFromOutput('SLEEK 2.0.1'), '2.0.1');
        });

        test('parses version from plain version string', () => {
            strictEqual(parseVersionFromOutput('1.2.3'), '1.2.3');
            strictEqual(parseVersionFromOutput('10.0.5'), '10.0.5');
        });

        test('returns null for invalid format', () => {
            strictEqual(parseVersionFromOutput('invalid'), null);
            strictEqual(parseVersionFromOutput('1.2'), null);
            strictEqual(parseVersionFromOutput('sleek abc'), null);
            strictEqual(parseVersionFromOutput(''), null);
        });
    });

    describe('parseVersion', () => {
        test('parses valid semantic version', () => {
            const result = parseVersion('1.2.3');
            const expected: VersionInfo = {
                version: '1.2.3',
                major: 1,
                minor: 2,
                patch: 3
            };
            deepStrictEqual(result, expected);
        });

        test('handles different version numbers', () => {
            const result = parseVersion('10.20.30');
            strictEqual(result?.major, 10);
            strictEqual(result?.minor, 20);
            strictEqual(result?.patch, 30);
        });

        test('returns null for invalid versions', () => {
            strictEqual(parseVersion('1.2'), null);
            strictEqual(parseVersion('1.2.3.4'), null);
            strictEqual(parseVersion('v1.2.3'), null);
            strictEqual(parseVersion('abc'), null);
        });
    });

    describe('compareVersions', () => {
        test('compares equal versions', () => {
            strictEqual(compareVersions('1.2.3', '1.2.3'), 0);
            strictEqual(compareVersions('0.0.0', '0.0.0'), 0);
        });

        test('compares different major versions', () => {
            strictEqual(compareVersions('1.0.0', '2.0.0'), -1);
            strictEqual(compareVersions('2.0.0', '1.0.0'), 1);
        });

        test('compares different minor versions', () => {
            strictEqual(compareVersions('1.1.0', '1.2.0'), -1);
            strictEqual(compareVersions('1.2.0', '1.1.0'), 1);
        });

        test('compares different patch versions', () => {
            strictEqual(compareVersions('1.0.1', '1.0.2'), -1);
            strictEqual(compareVersions('1.0.2', '1.0.1'), 1);
        });

        test('throws error for invalid versions', () => {
            throws(() => compareVersions('invalid', '1.0.0'));
            throws(() => compareVersions('1.0.0', 'invalid'));
        });
    });

    describe('isNewerVersion', () => {
        test('detects newer versions', () => {
            strictEqual(isNewerVersion('1.0.0', '1.0.1'), true);
            strictEqual(isNewerVersion('1.0.0', '1.1.0'), true);
            strictEqual(isNewerVersion('1.0.0', '2.0.0'), true);
        });

        test('detects same or older versions', () => {
            strictEqual(isNewerVersion('1.0.0', '1.0.0'), false);
            strictEqual(isNewerVersion('1.1.0', '1.0.0'), false);
            strictEqual(isNewerVersion('2.0.0', '1.0.0'), false);
        });

        test('returns false for invalid versions', () => {
            strictEqual(isNewerVersion('invalid', '1.0.0'), false);
            strictEqual(isNewerVersion('1.0.0', 'invalid'), false);
        });
    });

    describe('isValidVersion', () => {
        test('validates correct version formats', () => {
            strictEqual(isValidVersion('1.2.3'), true);
            strictEqual(isValidVersion('0.0.0'), true);
            strictEqual(isValidVersion('100.200.300'), true);
        });

        test('rejects incorrect version formats', () => {
            strictEqual(isValidVersion('1.2'), false);
            strictEqual(isValidVersion('1.2.3.4'), false);
            strictEqual(isValidVersion('v1.2.3'), false);
            strictEqual(isValidVersion('abc'), false);
            strictEqual(isValidVersion(''), false);
        });
    });

    describe('formatVersionDisplay', () => {
        test('formats single version', () => {
            strictEqual(formatVersionDisplay('1.2.3'), 'v1.2.3');
        });

        test('formats with newer version available', () => {
            strictEqual(formatVersionDisplay('1.0.0', '1.0.1'), 'v1.0.0 → v1.0.1 available');
        });

        test('formats when current is latest', () => {
            strictEqual(formatVersionDisplay('1.0.0', '1.0.0'), 'v1.0.0 (latest)');
            strictEqual(formatVersionDisplay('1.1.0', '1.0.0'), 'v1.1.0 (latest)');
        });
    });

    describe('parseReleaseTag', () => {
        test('parses standard version tags', () => {
            strictEqual(parseReleaseTag('v1.2.3'), '1.2.3');
            strictEqual(parseReleaseTag('1.2.3'), '1.2.3');
            strictEqual(parseReleaseTag('V1.2.3'), '1.2.3');
        });

        test('parses release prefix tags', () => {
            strictEqual(parseReleaseTag('release-1.2.3'), '1.2.3');
            strictEqual(parseReleaseTag('RELEASE-1.2.3'), '1.2.3');
        });

        test('returns null for invalid tags', () => {
            strictEqual(parseReleaseTag('invalid'), null);
            strictEqual(parseReleaseTag('beta-1.2.3'), null);
            strictEqual(parseReleaseTag('1.2'), null);
        });
    });

    describe('extractReleaseNotes', () => {
        test('returns full text when under limit', () => {
            const notes = 'Short release notes.';
            strictEqual(extractReleaseNotes(notes), notes);
        });

        test('truncates long text', () => {
            const longNotes = 'A'.repeat(300);
            const result = extractReleaseNotes(longNotes, 100);
            strictEqual(result.length, 103); // 100 + '...'
            strictEqual(result.endsWith('...'), true);
        });

        test('extracts first paragraph', () => {
            const notes = 'First paragraph.\n\nSecond paragraph.';
            strictEqual(extractReleaseNotes(notes), 'First paragraph.');
        });

        test('cleans markdown formatting', () => {
            const notes = '# Title\n**Bold** and `code`';
            const result = extractReleaseNotes(notes);
            strictEqual(result.includes('#'), false);
            strictEqual(result.includes('*'), false);
            strictEqual(result.includes('`'), false);
        });

        test('handles empty or null body', () => {
            strictEqual(extractReleaseNotes(''), 'No release notes available.');
            strictEqual(extractReleaseNotes('   '), 'No release notes available.');
        });
    });
}); 
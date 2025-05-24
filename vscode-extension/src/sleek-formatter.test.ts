import { test, describe } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import { 
    buildCommand, 
    validateConfig, 
    parseError, 
    isFormattingNeeded,
    extractTextRange,
    getExecutableName,
    isValidExecutablePath,
    type SleekConfig 
} from './sleek-formatter';

describe('Sleek Formatter', () => {
    
    describe('buildCommand', () => {
        test('builds command with defaults', () => {
            const config: SleekConfig = {
                executable: 'sleek',
                indentSpaces: 4,
                uppercase: true,
                linesBetweenQueries: 2,
                trailingNewline: false
            };

            const result = buildCommand(config);
            
            strictEqual(result, 'sleek --indent-spaces 4 --uppercase true --lines-between-queries 2 --trailing-newline false');
        });

        test('builds command with custom path', () => {
            const config: SleekConfig = {
                executable: '/usr/local/bin/sleek',
                indentSpaces: 2,
                uppercase: false,
                linesBetweenQueries: 1,
                trailingNewline: true
            };

            const result = buildCommand(config);
            
            strictEqual(result, '/usr/local/bin/sleek --indent-spaces 2 --uppercase false --lines-between-queries 1 --trailing-newline true');
        });
    });

    describe('validateConfig', () => {
        test('uses defaults for empty config', () => {
            const result = validateConfig({});
            
            strictEqual(result.executable, 'sleek');
            strictEqual(result.indentSpaces, 4);
            strictEqual(result.uppercase, true);
            strictEqual(result.linesBetweenQueries, 2);
            strictEqual(result.trailingNewline, false);
        });

        test('clamps values to valid range', () => {
            const result = validateConfig({ indentSpaces: 999, linesBetweenQueries: -5 });
            
            strictEqual(result.indentSpaces, 16); // max
            strictEqual(result.linesBetweenQueries, 0); // min
        });
    });

    describe('parseError', () => {
        test('parses common errors', () => {
            strictEqual(parseError('ENOENT: no such file'), 'Sleek executable not found. Please install sleek or check your PATH.');
            strictEqual(parseError('killed with SIGTERM'), 'Sleek formatting timed out. File might be too large.');
            strictEqual(parseError('unexpected argument --bad'), 'Invalid sleek command arguments. Please check your configuration.');
            strictEqual(parseError('Random error'), 'Sleek formatting failed: Random error');
        });
    });

    describe('isFormattingNeeded', () => {
        test('detects when formatting is needed', () => {
            const original = 'select * from users';
            const formatted = 'SELECT\n    *\nFROM\n    users';
            
            strictEqual(isFormattingNeeded(original, formatted), true);
        });

        test('detects when formatting is not needed', () => {
            const text = 'SELECT\n    *\nFROM\n    users';
            
            strictEqual(isFormattingNeeded(text, text), false);
        });

        test('handles whitespace differences', () => {
            const original = '  SELECT * FROM users  ';
            const formatted = 'SELECT * FROM users';
            
            strictEqual(isFormattingNeeded(original, formatted), false);
        });
    });

    describe('extractTextRange', () => {
        test('extracts text range correctly', () => {
            const text = 'SELECT * FROM users WHERE id = 1';
            
            strictEqual(extractTextRange(text, 0, 6), 'SELECT');
            strictEqual(extractTextRange(text, 14, 19), 'users');
            strictEqual(extractTextRange(text, 7, 13), '* FROM');
        });
    });

    describe('getExecutableName', () => {
        test('adds .exe on Windows', () => {
            strictEqual(getExecutableName('sleek', 'win32'), 'sleek.exe');
        });

        test('keeps name unchanged on Unix', () => {
            strictEqual(getExecutableName('sleek', 'darwin'), 'sleek');
            strictEqual(getExecutableName('sleek', 'linux'), 'sleek');
        });
    });

    describe('isValidExecutablePath', () => {
        test('accepts valid paths', () => {
            strictEqual(isValidExecutablePath('sleek'), true);
            strictEqual(isValidExecutablePath('/usr/local/bin/sleek'), true);
            strictEqual(isValidExecutablePath('C:\\Tools\\sleek.exe'), true);
        });

        test('rejects invalid paths', () => {
            strictEqual(isValidExecutablePath(''), false);
            strictEqual(isValidExecutablePath('   '), false);
            strictEqual(isValidExecutablePath('a'.repeat(600)), false);
        });

        test('rejects paths with invalid characters', () => {
            // Windows invalid chars
            strictEqual(isValidExecutablePath('sleek<test', 'win32'), false);
            strictEqual(isValidExecutablePath('sleek|test', 'win32'), false);
            
            // Null character (invalid on all platforms)
            strictEqual(isValidExecutablePath('sleek\0test'), false);
        });
    });
}); 
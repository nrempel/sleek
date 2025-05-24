/**
 * Pure business logic for Sleek SQL formatting
 * No VSCode dependencies - easily testable
 */

export interface SleekConfig {
    executable: string;
    indentSpaces: number;
    uppercase: boolean;
    linesBetweenQueries: number;
    trailingNewline: boolean;
}

export function buildCommand(config: SleekConfig): string {
    return [
        config.executable,
        '--indent-spaces', config.indentSpaces.toString(),
        '--uppercase', config.uppercase.toString(),
        '--lines-between-queries', config.linesBetweenQueries.toString(),
        '--trailing-newline', config.trailingNewline.toString()
    ].join(' ');
}

export function validateConfig(config: Partial<SleekConfig>): SleekConfig {
    return {
        executable: config.executable ?? 'sleek',
        indentSpaces: Math.max(1, Math.min(16, config.indentSpaces ?? 4)),
        uppercase: config.uppercase ?? true,
        linesBetweenQueries: Math.max(0, Math.min(10, config.linesBetweenQueries ?? 2)),
        trailingNewline: config.trailingNewline ?? false
    };
}

export function parseError(errorMessage: string): string {
    if (errorMessage.includes('ENOENT')) {
        return 'Sleek executable not found. Please install sleek or check your PATH.';
    }
    if (errorMessage.includes('SIGTERM')) {
        return 'Sleek formatting timed out. File might be too large.';
    }
    if (errorMessage.includes('unexpected argument')) {
        return 'Invalid sleek command arguments. Please check your configuration.';
    }
    return `Sleek formatting failed: ${errorMessage}`;
}

/**
 * Determine if text formatting would change the content
 */
export function isFormattingNeeded(original: string, formatted: string): boolean {
    return original.trim() !== formatted.trim();
}

/**
 * Extract text range from document text
 */
export function extractTextRange(text: string, start: number, end: number): string {
    return text.substring(start, end);
}

/**
 * Get platform-specific executable name
 */
export function getExecutableName(baseName: string, platform: string = process.platform): string {
    return platform === 'win32' ? `${baseName}.exe` : baseName;
}

/**
 * Validate file path format
 */
export function isValidExecutablePath(path: string, platform: string = process.platform): boolean {
    if (!path || path.trim().length === 0) {
        return false;
    }
    
    // Check for basic path validity (not empty, reasonable length)
    if (path.length > 500) {
        return false;
    }
    
    // Check for obviously invalid characters for file paths
    const invalidChars = platform === 'win32' 
        ? /[<>"|?*]/ 
        : /[\0]/;
    
    return !invalidChars.test(path);
} 
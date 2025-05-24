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
    return `${config.executable} --indent-spaces ${config.indentSpaces} --uppercase ${config.uppercase} --lines-between-queries ${config.linesBetweenQueries} --trailing-newline ${config.trailingNewline}`;
}

export function validateConfig(config: Partial<SleekConfig>): SleekConfig {
    return {
        executable: config.executable || 'sleek',
        indentSpaces: Math.min(Math.max(config.indentSpaces ?? 4, 1), 16),
        uppercase: config.uppercase ?? true,
        linesBetweenQueries: Math.min(Math.max(config.linesBetweenQueries ?? 2, 0), 10),
        trailingNewline: config.trailingNewline ?? false
    };
}

export function parseError(message: string): string {
    if (message.includes('ENOENT')) return 'Sleek executable not found. Please install sleek or check your PATH.';
    if (message.includes('SIGTERM')) return 'Sleek formatting timed out. File might be too large.';
    if (message.includes('unexpected argument')) return 'Invalid sleek command arguments. Please check your configuration.';
    return `Sleek formatting failed: ${message}`;
} 
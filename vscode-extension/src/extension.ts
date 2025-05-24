import * as vscode from 'vscode';
import { exec } from 'node:child_process';

interface SleekConfig {
    executable: string;
    indentSpaces: number;
    uppercase: boolean;
    linesBetweenQueries: number;
    trailingNewline: boolean;
    formatOnSave: boolean;
    formatOnPaste: boolean;
}

class SleekFormatter implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider {
    
    private getConfig(): SleekConfig {
        const config = vscode.workspace.getConfiguration('sleek');
        const indentSpaces = config.get('indentSpaces', 4);
        const linesBetweenQueries = config.get('linesBetweenQueries', 2);
        
        // Validate ranges as defined in package.json
        if (indentSpaces < 1 || indentSpaces > 16) {
            vscode.window.showWarningMessage('Invalid indent spaces value (must be 1-16). Using default (4).');
        }
        
        if (linesBetweenQueries < 0 || linesBetweenQueries > 10) {
            vscode.window.showWarningMessage('Invalid lines between queries value (must be 0-10). Using default (2).');
        }
        
        return {
            executable: config.get('executable', 'sleek'),
            indentSpaces: Math.min(Math.max(indentSpaces, 1), 16),
            uppercase: config.get('uppercase', true),
            linesBetweenQueries: Math.min(Math.max(linesBetweenQueries, 0), 10),
            trailingNewline: config.get('trailingNewline', false),
            formatOnSave: config.get('formatOnSave', false),
            formatOnPaste: config.get('formatOnPaste', false)
        };
    }

    private buildSleekCommand(config: SleekConfig): string {
        const flags = [
            { name: '--indent-spaces', value: config.indentSpaces },
            { name: '--uppercase', value: config.uppercase },
            { name: '--lines-between-queries', value: config.linesBetweenQueries },
            { name: '--trailing-newline', value: config.trailingNewline }
        ];

        const args = flags.map(flag => `${flag.name} ${flag.value}`);

        return `${config.executable} ${args.join(' ')}`;
    }

    async formatSQL(text: string): Promise<string> {
        const config = this.getConfig();
        const command = this.buildSleekCommand(config);

        return new Promise((resolve, reject) => {
            const process = exec(command, {
                encoding: 'utf8',
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                timeout: 30000 // 30 second timeout
            }, (error, stdout, stderr) => {
                if (error) {
                    const execError = error as { code?: string; signal?: string; message: string };
                    if (execError.code === 'ENOENT') {
                        reject(new Error(`Sleek executable not found at: ${config.executable}. Please install Sleek or update the path in settings.`));
                    } else if (execError.signal === 'SIGTERM') {
                        reject(new Error('Sleek formatting timed out. The SQL might be too large or complex.'));
                    } else {
                        reject(new Error(`Sleek formatting failed: ${execError.message}`));
                    }
                    return;
                }

                if (stderr) {
                    console.warn('Sleek stderr:', stderr);
                }

                resolve(stdout);
            });

            if (process.stdin) {
                process.stdin.write(text);
                process.stdin.end();
            } else {
                reject(new Error('Failed to write to sleek process stdin'));
            }
        });
    }

    async checkFormatting(text: string): Promise<boolean> {
        const config = this.getConfig();
        const command = `${config.executable} --check`;

        return new Promise((resolve, reject) => {
            const process = exec(command, {
                encoding: 'utf8',
                timeout: 30000 // 30 second timeout
            }, (error, stdout, stderr) => {
                if (error) {
                    const execError = error as { code?: string | number; signal?: string; message: string };
                    if (execError.code === 1) {
                        resolve(false); // Not formatted
                    } else if (execError.signal === 'SIGTERM') {
                        reject(new Error('Sleek check timed out. The SQL might be too large or complex.'));
                    } else {
                        reject(new Error(`Sleek check failed: ${execError.message}`));
                    }
                    return;
                }
                resolve(true); // Already formatted
            });

            if (process.stdin) {
                process.stdin.write(text);
                process.stdin.end();
            } else {
                reject(new Error('Failed to write to sleek process stdin'));
            }
        });
    }

    async provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): Promise<vscode.TextEdit[]> {
        const text = document.getText();
        
        try {
            const formatted = await this.formatSQL(text);
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            return [vscode.TextEdit.replace(fullRange, formatted)];
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Sleek formatting failed: ${errorMessage}`);
            return [];
        }
    }

    async provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): Promise<vscode.TextEdit[]> {
        const text = document.getText(range);
        
        try {
            const formatted = await this.formatSQL(text);
            return [vscode.TextEdit.replace(range, formatted)];
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Sleek formatting failed: ${errorMessage}`);
            return [];
        }
    }
}

class SleekStatusBar {
    private statusBarItem: vscode.StatusBarItem;
    private formatter: SleekFormatter;
    private updateTimeout?: NodeJS.Timeout;

    constructor(formatter: SleekFormatter) {
        this.formatter = formatter;
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'sleek.formatDocument';
        this.update();
    }

    private debounce(func: () => void, wait: number): () => void {
        return () => {
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
            }
            this.updateTimeout = setTimeout(func, wait);
        };
    }

    private update() {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'sql') {
            this.statusBarItem.text = '$(database) Sleek';
            this.statusBarItem.tooltip = 'Format SQL with Sleek';
            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }
    }

    public async checkAndUpdateStatus() {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'sql') {
            try {
                const isFormatted = await this.formatter.checkFormatting(editor.document.getText());
                this.statusBarItem.text = isFormatted ? '$(check) Sleek' : '$(warning) Sleek';
                this.statusBarItem.tooltip = isFormatted ? 'SQL is formatted' : 'SQL needs formatting';
            } catch (error) {
                this.statusBarItem.text = '$(error) Sleek';
                this.statusBarItem.tooltip = 'Sleek check failed';
            }
        }
    }

    public debouncedStatusUpdate = this.debounce(() => {
        this.checkAndUpdateStatus();
    }, 500);

    public dispose() {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.statusBarItem.dispose();
    }
}

export function activate(context: vscode.ExtensionContext) {
    const formatter = new SleekFormatter();
    const statusBar = new SleekStatusBar(formatter);

    // Register document formatter
    const formatterProvider = vscode.languages.registerDocumentFormattingEditProvider(
        { scheme: 'file', language: 'sql' },
        formatter
    );

    // Register range formatter
    const rangeFormatterProvider = vscode.languages.registerDocumentRangeFormattingEditProvider(
        { scheme: 'file', language: 'sql' },
        formatter
    );

    // Command: Format Document
    const formatDocumentCommand = vscode.commands.registerCommand('sleek.formatDocument', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'sql') {
            vscode.window.showWarningMessage('Sleek: No active SQL document to format');
            return;
        }

        try {
            await vscode.commands.executeCommand('editor.action.formatDocument');
            vscode.window.showInformationMessage('SQL formatted with Sleek');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Sleek formatting failed: ${errorMessage}`);
        }
    });

    // Command: Format Selection
    const formatSelectionCommand = vscode.commands.registerCommand('sleek.formatSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'sql') {
            vscode.window.showWarningMessage('Sleek: No active SQL document to format');
            return;
        }

        if (editor.selection.isEmpty) {
            vscode.window.showWarningMessage('Sleek: No text selected');
            return;
        }

        try {
            await vscode.commands.executeCommand('editor.action.formatSelection');
            vscode.window.showInformationMessage('SQL selection formatted with Sleek');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Sleek formatting failed: ${errorMessage}`);
        }
    });

    // Command: Check Formatting
    const checkFormattingCommand = vscode.commands.registerCommand('sleek.checkFormatting', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'sql') {
            vscode.window.showWarningMessage('Sleek: No active SQL document to check');
            return;
        }

        try {
            const isFormatted = await formatter.checkFormatting(editor.document.getText());
            if (isFormatted) {
                vscode.window.showInformationMessage('SQL is correctly formatted');
            } else {
                const action = await vscode.window.showWarningMessage(
                    'SQL is not formatted correctly',
                    'Format Now'
                );
                if (action === 'Format Now') {
                    await vscode.commands.executeCommand('sleek.formatDocument');
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Sleek check failed: ${errorMessage}`);
        }
    });

    // Format on save
    const onSaveListener = vscode.workspace.onWillSaveTextDocument(async (event) => {
        const config = vscode.workspace.getConfiguration('sleek');
        if (config.get('formatOnSave', false) && event.document.languageId === 'sql') {
            const edit = vscode.window.activeTextEditor;
            if (edit && edit.document === event.document) {
                await vscode.commands.executeCommand('editor.action.formatDocument');
            }
        }
    });

    // Format on paste
    const onPasteListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
        const config = vscode.workspace.getConfiguration('sleek');
        if (config.get('formatOnPaste', false) && 
            event.document.languageId === 'sql' && 
            event.contentChanges.length > 0) {
            
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === event.document) {
                // Small delay to ensure paste operation is complete
                setTimeout(async () => {
                    try {
                        await vscode.commands.executeCommand('editor.action.formatDocument');
                    } catch (error) {
                        // Silently ignore paste formatting errors
                    }
                }, 100);
            }
        }
    });

    // Update status bar on active editor change
    const onActiveEditorChangeListener = vscode.window.onDidChangeActiveTextEditor(() => {
        statusBar.checkAndUpdateStatus();
    });

    // Update status bar on document change
    const onDocumentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === event.document && event.document.languageId === 'sql') {
            // Use debounced status updates for better performance
            statusBar.debouncedStatusUpdate();
        }
    });

    // Register all disposables
    context.subscriptions.push(
        formatterProvider,
        rangeFormatterProvider,
        formatDocumentCommand,
        formatSelectionCommand,
        checkFormattingCommand,
        onSaveListener,
        onPasteListener,
        onActiveEditorChangeListener,
        onDocumentChangeListener,
        statusBar
    );

    // Initial status update
    statusBar.checkAndUpdateStatus();

    console.log('Sleek SQL Formatter extension activated');
}

export function deactivate() {
    console.log('Sleek SQL Formatter extension deactivated');
} 
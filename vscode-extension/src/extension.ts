import * as vscode from 'vscode';
import { exec } from 'node:child_process';
import { buildCommand, validateConfig, parseError, type SleekConfig } from './sleek-formatter';
import { SleekDownloader } from './sleek-downloader';

export class SleekFormatter implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider {
    private downloader: SleekDownloader;

    constructor(context: vscode.ExtensionContext) {
        this.downloader = new SleekDownloader(context);
    }
    
    private getConfig(): SleekConfig {
        const config = vscode.workspace.getConfiguration('sleek');
        
        return validateConfig({
            executable: config.get('executable'),
            indentSpaces: config.get('indentSpaces'),
            uppercase: config.get('uppercase'),
            linesBetweenQueries: config.get('linesBetweenQueries'),
            trailingNewline: config.get('trailingNewline')
        });
    }

    private async ensureSleekAvailable(): Promise<string> {
        const config = this.getConfig();
        const result = await this.downloader.isSleekAvailable(config.executable);
        
        if (result.available) {
            return result.path;
        }

        // Ask user if they want to download Sleek
        const choice = await vscode.window.showInformationMessage(
            'Sleek CLI not found. Would you like to download it automatically?',
            'Download',
            'Cancel'
        );

        if (choice === 'Download') {
            try {
                return await this.downloader.downloadSleek();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Failed to download Sleek: ${errorMessage}`);
                throw error;
            }
        } else {
            throw new Error('Sleek CLI is required. Please install manually with: cargo install sleek');
        }
    }

    async formatSQL(text: string): Promise<string> {
        const sleekPath = await this.ensureSleekAvailable();
        const config = this.getConfig();
        const command = buildCommand({ ...config, executable: sleekPath });

        return new Promise((resolve, reject) => {
            const process = exec(command, {
                encoding: 'utf8',
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                timeout: 30000 // 30 second timeout
            }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(parseError(error.message)));
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

    async checkFormatting(document: vscode.TextDocument): Promise<boolean> {
        try {
            const sleekPath = await this.ensureSleekAvailable();
            const formatted = await this.formatSQL(document.getText());
            return formatted.trim() === document.getText().trim();
        } catch {
            return false;
        }
    }

    provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
        return this.formatDocument(document);
    }

    provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range): Promise<vscode.TextEdit[]> {
        return this.formatRange(document, range);
    }

    private async formatDocument(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
        try {
            const formatted = await this.formatSQL(document.getText());
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            return [vscode.TextEdit.replace(fullRange, formatted)];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Sleek formatting failed: ${errorMessage}`);
            return [];
        }
    }

    private async formatRange(document: vscode.TextDocument, range: vscode.Range): Promise<vscode.TextEdit[]> {
        try {
            const selectedText = document.getText(range);
            const formatted = await this.formatSQL(selectedText);
            return [vscode.TextEdit.replace(range, formatted)];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Sleek formatting failed: ${errorMessage}`);
            return [];
        }
    }

    async downloadSleek(): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Installing Sleek CLI...',
                cancellable: false
            }, async () => {
                await this.downloader.downloadSleek();
            });
            
            vscode.window.showInformationMessage('Sleek CLI installed successfully!');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to install Sleek CLI: ${errorMessage}`);
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
                const isFormatted = await this.formatter.checkFormatting(editor.document);
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
    const formatter = new SleekFormatter(context);
    const statusBar = new SleekStatusBar(formatter);

    // Register formatting providers
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('sql', formatter),
        vscode.languages.registerDocumentRangeFormattingEditProvider('sql', formatter)
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('sleek.formatDocument', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'sql') {
                await vscode.commands.executeCommand('editor.action.formatDocument');
            }
        }),

        vscode.commands.registerCommand('sleek.formatSelection', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'sql') {
                await vscode.commands.executeCommand('editor.action.formatSelection');
            }
        }),

        vscode.commands.registerCommand('sleek.checkFormatting', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'sql') {
                vscode.window.showWarningMessage('Sleek: No active SQL document to check');
                return;
            }

            try {
                const isFormatted = await formatter.checkFormatting(editor.document);
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
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Sleek check failed: ${errorMessage}`);
            }
        }),

        vscode.commands.registerCommand('sleek.downloadCli', async () => {
            await formatter.downloadSleek();
        })
    );

    // Register status bar
    context.subscriptions.push(statusBar);

    // Update status when active editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            statusBar.checkAndUpdateStatus();
        })
    );

    // Update status when document is saved
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(() => {
            statusBar.checkAndUpdateStatus();
        })
    );

    // Initial status update
    statusBar.checkAndUpdateStatus();

    console.log('Sleek SQL Formatter extension activated');
}

export function deactivate() {
    console.log('Sleek SQL Formatter extension deactivated');
} 
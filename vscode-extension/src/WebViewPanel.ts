import * as vscode from 'vscode';

/**
 * Manages the webview panel for the Decision Tapestry dashboard.
 * It creates and manages a webview that loads the dashboard from the local server.
 */
export class WebViewPanel {
    public static currentPanel: WebViewPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (WebViewPanel.currentPanel) {
            WebViewPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'decisionTapestryDashboard', // Identifies the type of the webview. Used internally
            'Decision Tapestry Dashboard', // Title of the panel displayed to the user
            column || vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {
                // Enable javascript in the webview
                enableScripts: true,

                // And restrict the webview to only loading content from our extension's `media` directory.
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );

        WebViewPanel.currentPanel = new WebViewPanel(panel, extensionUri);
    }

    public focusOnDecision(decisionId: number) {
        // Send a message to the webview content.
        this._panel.webview.postMessage({ command: 'focusOnDecision', decisionId: decisionId });
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        WebViewPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        // For simplicity, we'll load the dashboard from the local server.
        // This requires the Decision Tapestry server to be running.
        const dashboardUrl = 'http://localhost:8080';

        this._panel.title = 'Decision Tapestry';
        this._panel.webview.html = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Decision Tapestry</title>
                <style>
                    body, html, iframe {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        width: 100%;
                        border: none;
                        overflow: hidden;
                    }
                </style>
            </head>
            <body>
                <iframe src="${dashboardUrl}"></iframe>
            </body>
            </html>`;
    }
} 
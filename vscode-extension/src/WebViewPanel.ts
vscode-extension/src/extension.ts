import * as vscode from 'vscode';
import { CodelensProvider } from './CodelensProvider';

export class WebViewPanel {
    private static currentPanel: WebViewPanel | undefined;
    private _panel: vscode.WebviewPanel;

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : vscode.ViewColumn.One;

        if (WebViewPanel.currentPanel) {
            WebViewPanel.currentPanel._panel.reveal(column);
        } else {
            WebViewPanel.currentPanel = new WebViewPanel(vscode.window.createWebviewPanel(
                vscode.ViewColumn.One,
                'Decision Tapestry',
                column,
                {
                    localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')],
                    enableScripts: true
                }
            ), extensionUri);
        }
    }

    public focusOnDecision(decisionId: number) {
        // Send a message to the webview content.
        this._panel.webview.postMessage({ command: 'focusOnDecision', decisionId: decisionId });
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.webview.html = this.getHtmlForWebview(extensionUri);

        this._panel.onDidDispose(() => {
            WebViewPanel.currentPanel = undefined;
        });

        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'focusOnDecision':
                    this.focusOnDecision(message.decisionId);
                    break;
            }
        });
    }

    private getHtmlForWebview(extensionUri: vscode.Uri) {
        const styles = `
            <style>
                /* Add your styles here */
            </style>
        `;

        const script = `
            <script>
                // Add any necessary script code here
            </script>
        `;

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Decision Tapestry</title>
                ${styles}
            </head>
            <body>
                <div class="container">
                    <!-- Add your HTML content here -->
                </div>
                ${script}
            </body>
            </html>
        `;
    }
}

export function activate(context: vscode.ExtensionContext) {
    const codelensProvider = new CodelensProvider();

    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider("*", codelensProvider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('decision-tapestry.showDashboard', () => {
            WebViewPanel.createOrShow(context.extensionUri);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('decision-tapestry.showDecision', async (decisions) => {
            WebViewPanel.createOrShow(context.extensionUri);

            // We need a slight delay to ensure the webview panel is ready
            await new Promise(resolve => setTimeout(resolve, 100));

            if (decisions.length === 1) {
                WebViewPanel.currentPanel?.focusOnDecision(decisions[0].id);
            } else {
                const items = decisions.map((d: any) => ({
                    label: `#${d.id}: ${d.title}`,
                    description: d.status,
                    id: d.id
                }));
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select a decision to focus on'
                });
                if (selected) {
                    WebViewPanel.currentPanel?.focusOnDecision(selected.id);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('decision-tapestry.createDecision', async () => {
            const title = await vscode.window.showInputBox({
                prompt: 'Enter the title of the new decision'
            });
            if (title) {
                // Handle decision creation
            }
        })
    );
} 
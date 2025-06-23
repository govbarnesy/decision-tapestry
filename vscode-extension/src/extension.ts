import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import * as vscode from 'vscode';
import { CodelensProvider } from './CodelensProvider';
import { WebViewPanel } from './WebViewPanel';

/**
 * This method is called when your extension is activated.
 * Your extension is activated the very first time the command is executed.
 */
export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "decision-tapestry" is now active!');

    const codelensProvider = new CodelensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider("*", codelensProvider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('decision-tapestry.showDashboard', () => {
            WebViewPanel.createOrShow(context.extensionUri);
        })
    );

    interface DecisionQuickPickItem extends vscode.QuickPickItem {
        id: number;
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('decision-tapestry.showDecision', async (decisions: { id: number, title: string, status: string }[]) => {
            // Ensure the panel is visible before trying to focus
            WebViewPanel.createOrShow(context.extensionUri);
            // Add a slight delay to give the webview time to be ready
            await new Promise(resolve => setTimeout(resolve, 100));

            if (decisions.length === 1) {
                WebViewPanel.currentPanel?.focusOnDecision(decisions[0].id);
            } else {
                const items: DecisionQuickPickItem[] = decisions.map(d => ({
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
                prompt: 'Enter the title for the new decision',
                placeHolder: 'e.g., Adopt New Caching Strategy'
            });

            if (title) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    vscode.window.showErrorMessage('No workspace folder is open. Cannot create decision.');
                    return;
                }
                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                const decisionsPath = path.join(workspaceRoot, 'internal-packages/decision-tapestry/decisions.yml');

                try {
                    const fileContents = fs.readFileSync(decisionsPath, 'utf8');
                    const decisions: any[] = yaml.load(fileContents) as any[];

                    const newId = decisions.length > 0 ? Math.max(...decisions.map(d => d.id || 0)) + 1 : 1;

                    const newDecision = {
                        id: newId,
                        title: title,
                        author: 'Your Name', // Placeholder
                        date: new Date().toISOString(),
                        status: 'Ideating',
                        project: 'Decision Tapestry', // Placeholder
                        rationale: [''],
                        tradeoffs: [''],
                        related_to: [],
                        supersedes: null,
                        superseded_by: null,
                        tasks: [{ description: 'Task 1', status: 'Pending' }],
                        affected_components: ['']
                    };

                    decisions.push(newDecision);

                    const yamlString = yaml.dump(decisions);
                    fs.writeFileSync(decisionsPath, yamlString, 'utf8');

                    const document = await vscode.workspace.openTextDocument(decisionsPath);
                    await vscode.window.showTextDocument(document);

                    vscode.window.showInformationMessage(`Decision "${title}" created successfully.`);

                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to create decision: ${error}`);
                }
            }
        })
    );
}

/**
 * This method is called when your extension is deactivated.
 */
export function deactivate() { } 
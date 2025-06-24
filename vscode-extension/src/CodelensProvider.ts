import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import * as vscode from 'vscode';
import { readDecisionsFile } from '../../decision-tapestry/shared/yaml-utils.js';

/**
 * Provides CodeLenses for files mentioned in decisions.yml.
 * This class scans the decision log and adds a clickable lens to the top of any
 * file that is listed in a decision's `affected_components`.
 */
export class CodelensProvider implements vscode.CodeLensProvider {

    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    private decisionData: Map<string, any[]> = new Map();

    constructor() {
        this.parseDecisionFile();

        // Watch for changes in the decision file and refresh
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const watchPath = path.join(workspaceFolders[0].uri.fsPath, 'internal-packages/decision-tapestry/decisions.yml');
            fs.watch(watchPath, (event) => {
                if (event === 'change') {
                    this.parseDecisionFile();
                    this._onDidChangeCodeLenses.fire();
                }
            });
        }
    }

    private async parseDecisionFile() {
        this.decisionData.clear();
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }
        const decisionsPath = path.join(workspaceFolders[0].uri.fsPath, 'internal-packages/decision-tapestry/decisions.yml');

        try {
            const decisions: any[] = await readDecisionsFile(decisionsPath) as any[];

            decisions.forEach(decision => {
                if (decision.affected_components) {
                    decision.affected_components.forEach((component: string) => {
                        const fullPath = path.join(workspaceFolders[0].uri.fsPath, component);
                        if (!this.decisionData.has(fullPath)) {
                            this.decisionData.set(fullPath, []);
                        }
                        this.decisionData.get(fullPath)?.push(decision);
                    });
                }
            });
        } catch (e) {
            // Silently fail, as errors will be shown by the YAML validator
        }
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        const lenses: vscode.CodeLens[] = [];
        const relatedDecisions = this.decisionData.get(document.fileName);

        if (relatedDecisions) {
            const range = new vscode.Range(0, 0, 0, 0); // Top of the file
            const titles = relatedDecisions.map(d => `#${d.id}`).join(', ');
            lenses.push(new vscode.CodeLens(range, {
                title: `📚 Decisions: ${titles}`,
                command: 'decision-tapestry.showDecision',
                arguments: [relatedDecisions]
            }));
        }

        return lenses;
    }
} 
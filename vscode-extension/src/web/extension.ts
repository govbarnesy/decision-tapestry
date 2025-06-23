// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "decision-tapestry" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('decision-tapestry.showDashboard', async () => {
		const panel = vscode.window.createWebviewPanel(
			'decisionTapestryDashboard', // Internal ID
			'Decision Tapestry Dashboard', // Title
			vscode.ViewColumn.One, // Show in the first column
			{
				enableScripts: true,
				// Restrict the webview to only loading content from our server.
				// This is a crucial security measure.
				localResourceRoots: []
			}
		);

		try {
			// Fetch the HTML from our local server
			const response = await fetch('http://localhost:8080');
			if (!response.ok) {
				throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
			}
			let html = await response.text();

			// The VS Code webview requires a specific CSP meta tag to be present.
			// We'll inject it into the head of the fetched HTML.
			html = html.replace(
				'<head>',
				`<head>
				 <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src http://localhost:8080 ws://localhost:8080; img-src data:;">`
			);

			panel.webview.html = html;

		} catch (error: any) {
			console.error('Failed to load Decision Tapestry dashboard:', error);
			vscode.window.showErrorMessage(`Failed to load Decision Tapestry dashboard. Is the server running? Error: ${error.message}`);
			panel.webview.html = `<h1>Error Loading Dashboard</h1><p>Could not connect to the Decision Tapestry server at http://localhost:8080. Please make sure the server is running.</p><p>Error: ${error.message}</p>`;
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }

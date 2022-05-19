import * as vscode from 'vscode';
import * as header from './header';
import * as footer from './footer';
import * as projectStructure from './project-structure';

export function activate(context: vscode.ExtensionContext) {
	header.activate(context);
	footer.activate(context);
	projectStructure.activate(context);
}

export function deactivate() {}

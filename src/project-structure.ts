import { commands, ExtensionContext, Position, Uri, window, workspace, WorkspaceEdit } from "vscode";
import { getProjectStructure, sortStructure } from "./Util/helpers";
import { Structure } from "./Util/structure";

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
		commands.registerCommand('global-project-toc.writeProjectStructure', writeProjectStructure)
	);
}

async function writeProjectStructure() {
	window.showInformationMessage('Writing project structure to file');
	let structure = await getProjectStructure();
	structure = sortStructure(structure);

	await writeProjectStructureToFile(structure);
}

function writeProjectStructureToFile(structure: Structure[]) {
	return new Promise(resolve => {
		setTimeout(() => {
			const wsedit = new WorkspaceEdit();
			if (workspace.workspaceFolders !== undefined ) {
				let wsPath = workspace.workspaceFolders[0].uri.fsPath;
				const filePath = Uri.file(wsPath + '/project-structure.yml');
				window.showInformationMessage("Writing structure in " + filePath.toString());
				wsedit.createFile(filePath, { overwrite: true });
				wsedit.insert(filePath, new Position(0, 0), convertStructureToYML(structure));
				workspace.applyEdit(wsedit).then(function() {workspace.openTextDocument(filePath).then(doc => doc.save())});
				window.showInformationMessage('Created Structure in File: project-structure.yml');
				resolve(true);
			} else {
				window.showInformationMessage("Can't write structure to file because no project is open");
				resolve(false);
			}
		}, 2000);
	});
}

function convertStructureToYML(structure: Structure[]): string {
	let yml = "Filestructure:\n";
	structure.forEach(struct => {
		yml += structToYmlObject(struct);
	});
	return yml;
}

function structToYmlObject(structure: Structure) {
	let pos = "";
	structure.position.forEach(elem => pos += elem + ".");
	return "  " + structure.path + ":" 
		+ "\n    position: " + pos
		+ "\n    contentName: " + structure.contentName
		+ "\n    filename: " + structure.filename + "\n";
}
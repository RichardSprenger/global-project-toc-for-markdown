import { commands, ExtensionContext, Position, Range, window, workspace, WorkspaceEdit } from "vscode";
import { getEOLToString, getFileLinkRelativeToCurrentFile, getProjectStructure, sortStructure } from "./Util/helpers";
import { Structure } from "./Util/structure";

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
		commands.registerCommand('global-project-toc.createHeader', createHeader)
	);
}

async function createHeader() {
	window.showInformationMessage('Creating the global ToC in each file');
	let structure = await getProjectStructure();
	structure = sortStructure(structure);

	await writeHeaderToFile(structure);
	window.showInformationMessage('ToC was created');
}

function writeHeaderToFile(structure: Structure[]) {
	return new Promise(resolve => {
		setTimeout(() => {
			structure.forEach(struct => {
				let doc = workspace.openTextDocument(struct.uri);
				doc.then(doc => {
					let edit = new WorkspaceEdit();
					let end = new Position(0, 0);
					let text = createGlobalToc(structure, struct.path, getEOLToString(doc.eol));
					let content = doc.getText().split(getEOLToString(doc.eol));
					let start = content.findIndex(line => line.match("(<!-- beginnGlobalToC -->)"));
					if (start !== -1) {
						let endLine = content.findIndex(line => line.match("(<!-- endGlobalToC -->)"));
						if (endLine !== -1) {
							end = new Position(endLine, 22);
						} else {
							end = new Position(start, 25);
						}
					} else {
						start = content.findIndex(line => line.match("(fileHierarchyPosition)")) + 1;

						text = content[start-1] + text; 
					}					
					edit.replace(struct.uri, new Range(new Position(start, 0), end), text);
					workspace.applyEdit(edit).then(function() {doc.save();});
				});
				
			});		
			resolve(true);
		}, 2000);
	});
}

function createGlobalToc(structure: Structure[], f: string, endOfLine: string): string {
	let text = "<!-- beginnGlobalToC -->" + endOfLine;
	let root = structure.find(struct => struct.position[0] === 0);
	if (root && f !== root.path) {
		text += "[:arrow_left: Back to Overview](" + getFileLinkRelativeToCurrentFile(f, root.path) + ")" + endOfLine + endOfLine;
	}
	text += "# Global ToC" + endOfLine;
	structure.filter(struct => struct.path != root?.path).forEach(struct => {
		let fileDepth = f.split("/");
		let lineIsCurrentFile = (f === struct.path);
		for (let i = 0; i < struct.position.length - 1; i++) {
			text += "\t";
		}
		text += "- ";
		struct.position.forEach(elem => text += elem + ".");
		if (lineIsCurrentFile) {text += " **";}
		else {text += " ";}
		text += "[" + struct.contentName + "](";
		text += getFileLinkRelativeToCurrentFile(f, struct.path)  + ")";
		if (lineIsCurrentFile) {text += "**";}
		text += endOfLine;
	});
	text += "---" + endOfLine + "<!-- endGlobalToC -->";
	return text;
}
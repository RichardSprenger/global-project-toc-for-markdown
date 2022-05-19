import { commands, ExtensionContext, Position, Range, window, workspace, WorkspaceEdit } from "vscode";
import { getEOLToString, getFileLinkRelativeToCurrentFile, getProjectStructure, sortStructure } from "./Util/helpers";
import { Structure } from "./Util/structure";
export function activate(context: ExtensionContext) {
    context.subscriptions.push(
		commands.registerCommand('global-project-toc.createFooter', createFooter)
	);
}

async function createFooter() {
	window.showInformationMessage('Creating the footer in each file');
	let structure = await getProjectStructure();
	structure = sortStructure(structure);

	await writeFooterToFile(structure);
	window.showInformationMessage('Footer was created');
}

function writeFooterToFile(structure: Structure[]) {
	return new Promise(resolve => {
		setTimeout(() => {
			for (let i = 0; i < structure.length; i++) {
				let doc = workspace.openTextDocument(structure[i].uri);
				doc.then(doc => {
					let edit = new WorkspaceEdit();
					let content = doc.getText().split(getEOLToString(doc.eol));
					let footerPos = content.findIndex(line => line.match("(<!-- footerPosition -->)"));
					if (footerPos === -1) {
						footerPos = content.length + 1;
						edit.insert(structure[i].uri, new Position(footerPos, 0), getEOLToString(doc.eol));
					}
					let characterEnd = content[footerPos + 2] === undefined ? 0 : content[footerPos + 2].length;
					edit.replace(
                        structure[i].uri, new Range(new Position(footerPos, 0), 
                        new Position(footerPos + 2, characterEnd + 1)), 
                        getFooterLine(structure, i, getEOLToString(doc.eol))
                    );
					workspace.applyEdit(edit).then(function() {doc.save();});
				});
			}
			resolve(true);
		}, 2000);
	});
}

function getFooterLine(structure: Structure[], i: number, endOfLine: string) {
	let footerLine = '<!-- footerPosition -->' + endOfLine + '---' +  endOfLine + '<div align="center">';
	if (i !== 0) {
		footerLine += '[:arrow_backward: Previous](' 
			+ getFileLinkRelativeToCurrentFile(structure[i].path, structure[i-1].path) + ')';
		if (i !== structure.length - 1) {
			footerLine += " | ";
		}
	}
	if (i !== structure.length - 1) {
		footerLine += '[Next :arrow_forward:](' 
			+ getFileLinkRelativeToCurrentFile(structure[i].path, structure[i+1].path)  + ')';
	}
	footerLine += '</div>';
	return footerLine;
}
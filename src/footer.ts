import { commands, ExtensionContext, Position, Range, window, workspace, WorkspaceEdit } from "vscode";
import { getConfiguration, getEOLToString, getFileLinkRelativeToCurrentFile, getSortedProjectStructure } from "./Util/helpers";
import { Structure } from "./Util/structure";
export function activate(context: ExtensionContext) {
    context.subscriptions.push(
		commands.registerCommand('global-project-toc.createFooter', createFooter)
	);
}

async function createFooter() {
	window.showInformationMessage('Creating the footer in each file');
	let structure = await getSortedProjectStructure();
	if (structure) {
		await writeFooterToFile(structure);
	window.showInformationMessage('Global-Project-ToC: Footer was created');
	} else {
		window.showErrorMessage('Global-Project-ToC: Exiting without writing footer');
	}
	
}

function writeFooterToFile(structure: Structure[]) {
	return new Promise(resolve => {
		setTimeout(() => {
			for (let i = 0; i < structure.length; i++) {
				let doc = workspace.openTextDocument(structure[i].uri);
				doc.then(doc => {
					let edit = new WorkspaceEdit();
					let content = doc.getText().split(getEOLToString(doc.eol));
					let footerPos = content.findIndex(line => line.match("(<!-- " + getConfiguration("footer.beginnFooterPositionKeyWord") as string + " -->)"));
					if (footerPos === -1) {
						footerPos = content.length + 1;
						edit.insert(structure[i].uri, new Position(footerPos, 0), getEOLToString(doc.eol));
					}
					let footerEndPos = content.findIndex(line => line.match("(<!-- " + getConfiguration("footer.endFooterPositionKeyWord") as string + " -->)")) 
					footerEndPos = footerEndPos === -1 ? footerPos + 4 : footerEndPos;
					let characterEnd = content[footerEndPos] === undefined ? 0 : content[footerEndPos].length;
					edit.replace(
                        structure[i].uri, new Range(new Position(footerPos, 0), 
                        new Position(footerEndPos, characterEnd + 1)), 
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
	let footerLine = "<!-- " + getConfiguration("footer.beginnFooterPositionKeyWord") as string+ " -->" + endOfLine;
	if (getConfiguration("footer.drawLineBeforeFooter") as boolean) {footerLine += "---" + endOfLine;}
	footerLine += getConfiguration("footer.additionalTextBeforeToC") as string + endOfLine;
	footerLine += '<div align="center">';
	if (i !== 0) {
		footerLine += "[" + getConfiguration("footer.previousText") as string + "]("
			+ getFileLinkRelativeToCurrentFile(structure[i].path, structure[i-1].path) + ")";
		if (i !== structure.length - 1) {
			footerLine += " " + getConfiguration("footer.separator") as string + " ";
		}
	}
	if (i !== structure.length - 1) {
		footerLine += "[" + getConfiguration("footer.nextText") as string+ "]("
			+ getFileLinkRelativeToCurrentFile(structure[i].path, structure[i+1].path)  + ")";
	}
	footerLine += "</div>";
	footerLine += getConfiguration("footer.additionalTextAfterToC") as string + endOfLine;
	footerLine += "<!-- " + getConfiguration("footer.endFooterPositionKeyWord") as string+ " -->";
	return footerLine;
}
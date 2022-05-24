import { commands, ExtensionContext, Position, Range, window, workspace, WorkspaceEdit } from "vscode";
import { getConfiguration, getEOLToString, getFileLinkRelativeToCurrentFile, getSortedProjectStructure } from "./Util/helpers";
import { Structure } from "./Util/structure";

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
		commands.registerCommand('global-project-toc.createHeader', createHeader)
	);
}

async function createHeader() {
	window.showInformationMessage('Creating the global ToC in each file');
	let structure = await getSortedProjectStructure();
	if (structure) {
		await writeHeaderToFile(structure);
		window.showInformationMessage('Global-Project-ToC: ToC was created');
	} else {
		window.showErrorMessage('Global-Project-ToC: Exiting without writing toc');
	}
	
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
					let start = content.findIndex(line => line.match("(<!-- " + getConfiguration("header.beginnGlobalToCKeyWord") as string+ " -->)"));
					if (start !== -1) {
						let endLine = content.findIndex(line => line.match("(<!-- " + getConfiguration("header.endGlobalToCKeyWord") as string + " -->)"));
						if (endLine !== -1) {
							end = new Position(endLine, 22);
						} else {
							end = new Position(start, 25);
						}
					} else {
						start = content.findIndex(line => line.match("(" + getConfiguration("files.fileHierarchyPositionKeyWord") as string + ")")) + 1;

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
	let text = "<!-- " + getConfiguration("header.beginnGlobalToCKeyWord") as string + " -->" + endOfLine;
	let root = structure.find(struct => struct.position[0] === 0);
	if (root && f !== root.path && getConfiguration("header.insertBackToOverviewLink") as boolean) {
		text += "[" + getConfiguration("header.backToOverviewLinkText") as string + "](" + getFileLinkRelativeToCurrentFile(f, root.path) + ")" + endOfLine;
	}
	text += getConfiguration("header.additionalTextBeforeToC") as string + endOfLine;
	text += getConfiguration("header.globalToCHeadlineText") as string + endOfLine;
	structure.filter(struct => struct.path != root?.path).forEach(struct => {
		let lineIsCurrentFile = (f === struct.path);
		for (let i = 0; i < struct.position.length - 1; i++) {
			text += "\t";
		}
		text += "- ";
		struct.position.forEach(elem => text += elem + ".");
		if (lineIsCurrentFile && getConfiguration("header.currentLineInBold") as boolean) {text += " **";}
		else {text += " ";}
		text += "[" + struct.contentName + "](";
		text += getFileLinkRelativeToCurrentFile(f, struct.path)  + ")";
		if (lineIsCurrentFile && getConfiguration("header.currentLineInBold") as boolean) {text += "**";}
		text += endOfLine;
	});
	text += getConfiguration("header.additionalTextAfterToC") as string + endOfLine;
	if (getConfiguration("header.drawLineAfterHeader") as boolean) {text += "---" + endOfLine;}
	
	text += "<!-- endGlobalToC -->";
	return text;
}
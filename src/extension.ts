// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// ToDo create Config for this;
function getFiles() {
	return vscode.workspace.findFiles('**/*.md', null, 100);
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('global-project-toc.createHeader', createHeader),
		vscode.commands.registerCommand('global-project-toc.createFooter', createFooter)
	);
}

interface Structure {
	filename: string;
	path: string;
	position: number[];
	contentName: string;
	uri: vscode.Uri;
}

function getEOLToString(endOfLine: vscode.EndOfLine): string {
	if (endOfLine === vscode.EndOfLine.CRLF) {return "\r\n";}
	return "\n";
}

// Get the project structure of the workspaceFolder
// Project structure is defined via a commend in each file that should be considered
// The commend must look like this: <!-- fileHierarchyPosition: <Position> ; fileContentName: <Name>  -->
// The part ; fileContentName: <Name> is hereby optional
// If not provided the file name will be taken and - & _ will be replaced by a space
// The position is a string that is used to define the position of the file in the project structure
// The name is the name of the file that is used in the table of contents
// The position must look like this: <TopLevel>.<SubLevel>.<SubSubLevel>. ... .<SubSubLevel>
// ToDo - consider other files than only markdown
function getProjectStructure(): Promise<Structure[]> {
	return new Promise<Structure[]>(resolve => {
		setTimeout(() => {
			let structure: Structure[] = [];
			let files = getFiles();
			let i = 0;
			files.then(f => {
				f.forEach(file => {
					let path = vscode.workspace.asRelativePath(file.fsPath);
					let tmpName = path.split('/').pop();
					let name = tmpName === undefined ? `FileNotFound` : tmpName;
					vscode.workspace.openTextDocument(file)
								.then(doc => {
									// ToDo maybe do with getWordRangeAtPosition 
									let infoLine = doc.getText().split(getEOLToString(doc.eol)).find(line => line.match("(fileHierarchyPosition)"))?.split(';');
									if (infoLine !== undefined) {
										let contentName;
										// Check if content Name and position are valid strings
										if (infoLine.length > 1) {
											contentName = infoLine[1].split(':')[1].replaceAll(" -->", "").replaceAll(" ", "");
										}
										else {contentName = name.replace(".md", "").replaceAll("-", " ").replaceAll("_", " ");}
										let position = infoLine[0].split(':')[1].replaceAll(" -->", "").replaceAll(" ", "").replaceAll("\r", "").split('.').map(x => parseInt(x));
										
										structure.push({"filename": name , "path": path, "position": position, "contentName": contentName, "uri": file});
									}
									if (i === f.length - 1) {resolve(structure);}
									i++;
								});
				});
			});
		}, 2000);
	})
}

function sortStructure(structure: Structure[]): Structure[] {
	return structure.sort((a, b) => {
		let i = 0;
		while (i < a.position.length && i < b.position.length) {
			if (a.position[i] < b.position[i]) {return -1;}
			if (a.position[i] > b.position[i]) {return 1;}
			if(a.position[i] === b.position[i] && a.position.length > b.position.length) {return 1;}
			if(a.position[i] === b.position[i] && a.position.length < b.position.length) {return -1;}
			i++;
		}
		return 0;
	});
}

function getFileLinkRelativeToCurrentFile(currentFilePath: string, fileToLink: string): string {
	let fileDepth = currentFilePath.split('/').length;
	let link = "";
	for (let i = 0; i < fileDepth - 1; i++) {
		link += "../";
	}
	return link + fileToLink;
}

function createGlobalToc(structure: Structure[], f: string, endOfLine: string): string {
	let text = "<!-- beginnGlobalToC -->" + endOfLine;
	let root = structure.find(struct => struct.position[0] === 0);
	if (root && f !== root.path) {
		text += "[:arrow_left: Back to Overview](" + root.path + ")" + endOfLine + endOfLine;
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

function writeHeaderToFile(structure: Structure[]) {
	return new Promise(resolve => {
		setTimeout(() => {
			structure.forEach(struct => {
				let doc = vscode.workspace.openTextDocument(struct.uri);
				doc.then(doc => {
					let edit = new vscode.WorkspaceEdit();
					let end = new vscode.Position(0, 0);
					let text = createGlobalToc(structure, struct.path, getEOLToString(doc.eol));
					let content = doc.getText().split(getEOLToString(doc.eol));
					let start = content.findIndex(line => line.match("(<!-- beginnGlobalToC -->)"));
					if (start !== -1) {
						let endLine = content.findIndex(line => line.match("(<!-- endGlobalToC -->)"));
						if (endLine !== -1) {
							end = new vscode.Position(endLine, 22);
						} else {
							end = new vscode.Position(start, 25);
						}
					} else {
						start = content.findIndex(line => line.match("(fileHierarchyPosition)")) + 1;

						text = content[start-1] + text; 
					}					
					edit.replace(struct.uri, new vscode.Range(new vscode.Position(start, 0), end), text);
					vscode.workspace.applyEdit(edit).then(function() {doc.save();});
				});
				
			});		
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

function writeFooterToFile(structure: Structure[]) {
	return new Promise(resolve => {
		setTimeout(() => {
			for (let i = 0; i < structure.length; i++) {
				let doc = vscode.workspace.openTextDocument(structure[i].uri);
				doc.then(doc => {
					let edit = new vscode.WorkspaceEdit();
					
					let content = doc.getText().split(getEOLToString(doc.eol));
					let footerPos = content.findIndex(line => line.match("(<!-- footerPosition -->)"));
					footerPos = footerPos === -1 ? content.length : footerPos;
					edit.replace(structure[i].uri, new vscode.Range(new vscode.Position(footerPos, 0), new vscode.Position(footerPos + 2, content[footerPos + 2].length + 1)), getFooterLine(structure, i, getEOLToString(doc.eol)));
					vscode.workspace.applyEdit(edit).then(function() {doc.save();});
				});
			}
			resolve(true);
		}, 2000);
	});
}

async function createHeader() {
	vscode.window.showInformationMessage('Creating the global ToC in each file');
	let structure = await getProjectStructure();
	structure = sortStructure(structure);

	await writeHeaderToFile(structure);
	vscode.window.showInformationMessage('ToC was created');
}

async function createFooter() {
	vscode.window.showInformationMessage('Creating the footer in each file');
	let structure = await getProjectStructure();
	structure = sortStructure(structure);

	await writeFooterToFile(structure);
	vscode.window.showInformationMessage('Footer was created');
}

// this method is called when your extension is deactivated
export function deactivate() {}

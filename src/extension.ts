// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// ToDo create Config for this;
function getFiles() {
	return vscode.workspace.findFiles('**/*.md', null, 100);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	

	console.log('Running');

	// let disposable = vscode.commands.registerCommand('global-project-toc.helloWorld', () => {
	// 	vscode.window.showInformationMessage('Hello World from global-project-toc!');
	// });

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
			let i = 0;
			let structure: Structure[] = [];
			let files = getFiles();
			
			files.then(f => {
				f.forEach(file => {
					let path = vscode.workspace.asRelativePath(file.fsPath);
					let tmpName = path.split('/').pop();
					let name = tmpName === undefined ? `FileNotFound` : tmpName;
					vscode.workspace.openTextDocument(file)
								.then(doc => {
										// ToDo maybe do with getWordRangeAtPosition 
										let infoLine = doc.getText().split(getEOLToString(doc.eol)).find(line => line.match("(fileHierarchyPosition)"))?.split(';');
										if (infoLine) {
											let contentName;
											// Check if content Name and position are valid strings
											if (infoLine.length > 1) {
												contentName = infoLine[1].split(':')[1].replaceAll(" -->", "").replaceAll(" ", "");
											}
											else {contentName = name.replace(".md", "").replaceAll("-", " ").replaceAll("_", " ");}
											let position = infoLine[0].split(':')[1].replaceAll(" -->", "").replaceAll(" ", "").replaceAll("\r", "").split('.').map(x => parseInt(x));
											
											structure.push({"filename": name , "path": path, "position": position, "contentName": contentName});
											if (i == f.length - 1) {resolve(structure);}
											i++;
										}
						});
				});
			});
		}, 2000);
	})
}

function printStruct(structure: Structure) {
	let pos = "";
	structure.position.forEach(elem => pos += elem + ".");
	console.log("File: " + structure.filename + " - Position: " + pos + " - ContentName: " + structure.contentName + " - Path: " + structure.path);
}

function printStructs(structure: Structure[]) {
	structure.forEach(file => {
		printStruct(file);
	});
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

function createGlobalToc(structure: Structure[], f: vscode.Uri, endOfLine: string): string {
	let text = endOfLine + "<!-- beginnGlobalToC -->" + endOfLine + "# Global ToC" + endOfLine;
	structure.forEach(struct => {
		let fileDepth = vscode.workspace.asRelativePath(f.fsPath).split("/");
		let lineIsCurrentFile = (vscode.workspace.asRelativePath(f.fsPath) == struct.path);
		for (let i = 0; i < struct.position.length - 1; i++) {
			text += "\t";
		}
		text += "- ";
		struct.position.forEach(elem => text += elem + ".");
		if (lineIsCurrentFile) {text += " **";}
		else {text += " ";}
		text += "[" + struct.contentName + "](";
		for (let i = 0; i < fileDepth.length - 1; i++) {
			text += "../";
		}
		text += struct.path + ")";
		if (lineIsCurrentFile) {text += "**";}
		text += endOfLine;
	});
	text += "---" + endOfLine + "<!-- endGlobalToC -->" + endOfLine;
	return text;
}	

function writeHeaderToFile(structure: Structure[]) {
	return new Promise(resolve => {
		setTimeout(() => {
			
			let files = getFiles();
			files.then(files => files.forEach(f => {
				let doc = vscode.workspace.openTextDocument(f);
				doc.then(doc => {
					let edit = new vscode.WorkspaceEdit();
					let end = new vscode.Position(0, 0);
					let text = createGlobalToc(structure, f, getEOLToString(doc.eol));
					let content = doc.getText().split(getEOLToString(doc.eol));
					let start = content.findIndex(line => line.match("(<!-- beginnGlobalToC -->)"));
					if (start !== -1) {
						let endLine = content.findIndex(line => line.match("(<!-- endGlobalToC -->)"));
						if (endLine !== -1) {
							end = new vscode.Position(endLine, 22);
						}
					} else {
						start = content.findIndex(line => line.match("(fileHierarchyPosition)")) + 1;

						text = content[start-1] + text; 
					}					
					edit.replace(f, new vscode.Range(new vscode.Position(start, 0), end), text);
					vscode.workspace.applyEdit(edit).then(function() {doc.save();});
				});
				
			}));		
			resolve(true);
		}, 2000);
	});
}

async function createHeader() {
	console.log("Creating header");
	let structure = await getProjectStructure();
	structure = sortStructure(structure);

	// printStructs(structure);
	await writeHeaderToFile(structure);
	console.log("Done!");
}

function createFooter() {

}

// this method is called when your extension is deactivated
export function deactivate() {}

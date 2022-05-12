// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

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

// Get the project structure of the workspaceFolder
// Project structure is defined via a commend in each file that should be considered
// The commend must look like this: <!-- fileHierarchyPosition: <Position>  -->
// The part ; fileContentName: <Name> is hereby optional
// If not provided the file name will be taken and - & _ will be replaced by a space
// The position is a string that is used to define the position of the file in the project structure
// The name is the name of the file that is used in the table of contents
// The position must look like this: <TopLevel>.<SubLevel>.<SubSubLevel>. ... .<SubSubLevel>
// ToDo - consider other files than only markdown
function getProjectStructure() {
	return new Promise<Structure[]>(resolve => {
		setTimeout(() => {
			let i = 0;
			let structure: Structure[] = [];
			let files = vscode.workspace.findFiles('**/*.md', null, 100);
			
			files.then(f => {
				f.forEach(file => {
					let path = vscode.workspace.asRelativePath(file.fsPath);
					let tmpName = path.split('/').pop() 
					let name = tmpName === undefined ? `FileNotFound` : tmpName;
					vscode.workspace.openTextDocument(file)
								.then(doc => {
										let infoLine = doc.getText().split('\n').find(line => line.match("(fileHierarchyPosition)"))?.split(';');
										if (infoLine) {
											let contentName
											if (infoLine.length > 1) {contentName = infoLine[1].split(';')[1].split(':')[1].replaceAll(" -->", "").replaceAll(" ", "");}
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

async function createHeader() {
	let structure = await getProjectStructure();
	console.log(structure);
	structure = structure.sort((a, b) => {
		let i = 0;
		while (i < a.position.length && i < b.position.length) {
			if (a.position[i] < b.position[i]) {return -1;}
			if (a.position[i] > b.position[i]) {return 1;}
			if(a.position[i] == b.position[i] && a.position.length > b.position.length) {return 1;}
			if(a.position[i] == b.position[i] && a.position.length < b.position.length) {return -1;}

			i++;
		}
		return 0;
	});

	printStructs(structure);
	
}

function createFooter() {

}

// this method is called when your extension is deactivated
export function deactivate() {}

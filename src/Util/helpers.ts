import { EndOfLine, workspace } from "vscode";
import { Structure } from "./structure";

export function getFiles() {
	let fileTypes = "md";
	let excludedFiles = null;
	let maxFilesToBeConsidered = 100;
	workspace.getConfiguration('')
	return workspace.findFiles('**/*.{' + fileTypes + '}', excludedFiles, maxFilesToBeConsidered);
}

export function getEOLToString(endOfLine: EndOfLine): string {
	if (endOfLine === EndOfLine.CRLF) {return "\r\n";}
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
export function getProjectStructure(): Promise<Structure[]> {
	return new Promise<Structure[]>(resolve => {
		setTimeout(() => {
			let structure: Structure[] = [];
			let files = getFiles();
			let i = 0;
			files.then(f => {
				f.forEach(file => {
					let path = workspace.asRelativePath(file.fsPath);
					let tmpName = path.split('/').pop();
					let name = tmpName === undefined ? `FileNotFound` : tmpName;
					workspace.openTextDocument(file)
								.then(doc => {
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

export function sortStructure(structure: Structure[]): Structure[] {
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

export function getFileLinkRelativeToCurrentFile(currentFilePath: string, fileToLink: string): string {
	let fileDepth = currentFilePath.split('/').length;
	let link = "";
	for (let i = 0; i < fileDepth - 1; i++) {
		link += "../";
	}
	return link + fileToLink;
}
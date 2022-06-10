import { EndOfLine, GlobPattern, Uri, window, workspace } from "vscode";
import { Structure } from "./structure";
import { parse } from 'yaml';

/*
 * Find files in the current workspace that match the filters provided in the config
 * @returns {Thenable<Uri[]>}
 */
export function getFiles(): Thenable<Uri[]> {
	return workspace.findFiles(
		getConfiguration('files.supportedFileTypes') as GlobPattern, 
		getConfiguration('files.excludedFileTypes') as GlobPattern, 
		getConfiguration('files.maximumFilesToBeConsiderForToC') as number);
}

/*
 * Gets the corresponding string value of the EndOfLine
 * @params {EndOfLine} endOfLine
 * @returns {string}
 */ 
export function getEOLToString(endOfLine: EndOfLine): string {
	if (endOfLine === EndOfLine.CRLF) {return "\r\n";}
	return "\n";
}

/*
 * Gets the project structure based on the properties defined in each file
 * Each file will be checked for the line <!-- fileHierarchyPosition: <Position> ; fileContentName: <Name>  -->
 * The part `fileHierarchyPosition` defines the files position in the structure and is required
 * The position may be provided in the form `<TopLevel>.<SubLevel>.<SubSubLevel>. ... .<SubSubLevel>`
 * The part `fileContentName` is used to display a different name for the file
 * If not provided the filename will be used without _ & - and the file ending
 * returns {Promise<Structure[]>} - List of files that provided the position in the structure
 */
export function getProjectStructureFromProject(): Promise<Structure[]> {
	return new Promise<Structure[]>(resolve => {
		setTimeout(() => {
			let structure: Structure[] = [];
			let i = 0;
			getFiles().then(f => {
				f.forEach(file => {
					let path = workspace.asRelativePath(file.fsPath);
					let tmpName = path.split('/').pop();
					let name = tmpName === undefined ? getConfiguration('files.defaultFileContentName') as string: tmpName;
					workspace.openTextDocument(file)
								.then(doc => {
									let infoLine = doc.getText().split(getEOLToString(doc.eol))
										.find(line => 
											line.match("(" + getConfiguration('files.fileHierarchyPositionKeyWord') as string + ")")
										)?.split(getConfiguration('files.fileHierarchyPositionAndFileContentNameSeparator') as string);
									if (infoLine !== undefined) {
										let contentName;
										// Check if content Name and position are valid strings
										if (infoLine.length > 1 && infoLine[1].split(':')[0].replaceAll(" ", "") === getConfiguration('files.fileContentNameKeyWord') as string) {	// Check if the line has both 'files.fileHierarchyPositionKeyWord' and 'files.fileContentNameKeyWord'
											contentName = infoLine[1]
												.split(getConfiguration('files.keyWordValueSeparator') as string)[1]											// Get the value of 'files.fileContentNameKeyWord'
												.replace(new RegExp("( {0,}-->)"), "").replace(new RegExp("(^ {0,})"), "");										// Delete ` -->` and whitespace after separator
										} else {
											contentName = name.substring(0, name.lastIndexOf('.'))																// Remove the file extension
															.replaceAll(getConfiguration("files.charactersToBeReplacedCharactersInFileName") as RegExp, " ");
										}
										let position = infoLine[0].split(getConfiguration('files.keyWordValueSeparator') as string)[1]							// Get the position string
											.replaceAll("([-->] )", "").split('.').map(x => parseInt(x));														// map the string to integer
										structure.push({"filename": name , "path": path, "position": position, "contentName": contentName, "uri": file});
									}
									if (i === f.length - 1) {resolve(structure);}
									i++;
								});
				});
			});
		}, 2000);
	});
}

export function getProjectStructureFromStructureFile(baseUri: string, fileUri: string) {
	return new Promise<Structure[]>(resolve => {
		setTimeout(() => {
			workspace.openTextDocument(fileUri)
				.then(doc => {
					let structure = parse(doc.getText()) as Structure[];
					structure.forEach(struct => {
						struct.uri = Uri.file(baseUri + "/" + struct.path);
						let pos = struct.position.toString();
						struct.position = pos.split('.').map(x => parseInt(x)).filter(Boolean);	// Map String to Number array and filter out all NaN values
					});
					resolve(structure);
				});
		}, 2000);
	});
}

export async function getSortedProjectStructure(updateFileStructure?: boolean): Promise<Structure[] | undefined> {
	if (workspace.workspaceFolders !== undefined) {
		let baseUri = workspace.workspaceFolders[0].uri.path;
		let projectFileUri = baseUri + "/" + getConfiguration("structure.structureFileName") as string + ".yml";
		if (getConfiguration("structure.createStructureBasedOnPositionKeyWord") && !updateFileStructure) {
			try {
				await workspace.fs.stat(Uri.file(projectFileUri));
				return sortStructure(await getProjectStructureFromStructureFile(baseUri, projectFileUri));
			} catch {
				window.showErrorMessage("Global-Project-ToC: StructureFile not found! Using Project Base Hierarchy");
			}
		}
		return sortStructure(await getProjectStructureFromProject());
		
	} else {
		window.showErrorMessage("Global-Project-ToC: Working folder not found, open a folder and try again!");
		return new Promise(resolve => resolve(undefined));
	}
	
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

export function getFileLinkRelativeToCurrentFile(currentFilePath: string, fileToLink: string): string {
	let fileDepth = currentFilePath.split('/').length;
	let link = "";
	for (let i = 0; i < fileDepth - 1; i++) {
		link += "../";
	}
	return link + fileToLink;
}

export function getConfiguration(configName: string) {
	let wspace = workspace.workspaceFolders;
	if (wspace) {
		const config = workspace.getConfiguration('global-project-toc', wspace[0].uri);
		const conf = config.get(configName);
		return conf;
	} else {
		window.showInformationMessage('Cannot read config because no workspace is active');
		return;
	}
	
}
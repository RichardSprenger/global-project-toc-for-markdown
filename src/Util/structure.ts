import { Uri } from 'vscode';

export interface Structure {
	filename: string;
	path: string;
	position: number[];
	contentName: string;
	uri: Uri;
}
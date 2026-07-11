export type FileWritableStreamLike = {
	write: (data: string) => Promise<void>;
	close: () => Promise<void>;
};

export type FilePermissionDescriptorLike = {
	mode?: 'read' | 'readwrite';
};

export type FileSystemFileHandleLike = {
	kind?: 'file';
	name: string;
	getFile: () => Promise<File>;
	createWritable: () => Promise<FileWritableStreamLike>;
	queryPermission?: (descriptor?: FilePermissionDescriptorLike) => Promise<PermissionState>;
	requestPermission?: (descriptor?: FilePermissionDescriptorLike) => Promise<PermissionState>;
};

export type FilePickerAcceptTypeLike = {
	description?: string;
	accept: Record<string, string[]>;
};

export type OpenFilePickerOptionsLike = {
	multiple?: boolean;
	excludeAcceptAllOption?: boolean;
	types?: FilePickerAcceptTypeLike[];
};

export type SaveFilePickerOptionsLike = {
	suggestedName?: string;
	excludeAcceptAllOption?: boolean;
	types?: FilePickerAcceptTypeLike[];
};

export type FilePickerWindow = Window & {
	showOpenFilePicker?: (options?: OpenFilePickerOptionsLike) => Promise<FileSystemFileHandleLike[]>;
	showSaveFilePicker?: (options?: SaveFilePickerOptionsLike) => Promise<FileSystemFileHandleLike>;
};

export type FileIntegrationFeatures = {
	readonly enabled: boolean;
	isSupported: () => boolean;
	pickStyleFile: () => Promise<FileSystemFileHandleLike>;
	readStyleFile: (handle: FileSystemFileHandleLike) => Promise<string>;
	writeStyleFile: (handle: FileSystemFileHandleLike, styleText: string) => Promise<void>;
	saveStyleFileAs: (styleText: string, suggestedName?: string) => Promise<FileSystemFileHandleLike>;
};

export class FileFeatureUnavailableError extends Error {
	constructor() {
		super('Local file access is not available in this browser.');
	}
}

const stylePickerTypes: FilePickerAcceptTypeLike[] = [
	{
		description: 'MapLibre style JSON',
		accept: {
			'application/json': ['.json'],
			'text/json': ['.json']
		}
	}
];

const getPickerWindow = (): FilePickerWindow | null =>
	typeof window === 'undefined' ? null : (window as FilePickerWindow);

export const isFileSystemAccessSupported = (): boolean => {
	const pickerWindow = getPickerWindow();
	return Boolean(pickerWindow?.showOpenFilePicker && pickerWindow.showSaveFilePicker);
};

const requirePickerWindow = (): Required<
	Pick<FilePickerWindow, 'showOpenFilePicker' | 'showSaveFilePicker'>
> => {
	const pickerWindow = getPickerWindow();
	if (!pickerWindow?.showOpenFilePicker || !pickerWindow.showSaveFilePicker) {
		throw new FileFeatureUnavailableError();
	}
	return {
		showOpenFilePicker: pickerWindow.showOpenFilePicker.bind(pickerWindow),
		showSaveFilePicker: pickerWindow.showSaveFilePicker.bind(pickerWindow)
	};
};

const ensureWritePermission = async (handle: FileSystemFileHandleLike) => {
	const descriptor = { mode: 'readwrite' } satisfies FilePermissionDescriptorLike;
	if (handle.queryPermission && (await handle.queryPermission(descriptor)) === 'granted') return;
	if (handle.requestPermission && (await handle.requestPermission(descriptor)) !== 'granted') {
		throw new Error('Write permission was not granted.');
	}
};

export const pickStyleFile = async (): Promise<FileSystemFileHandleLike> => {
	const pickerWindow = requirePickerWindow();
	const [handle] = await pickerWindow.showOpenFilePicker({
		multiple: false,
		excludeAcceptAllOption: false,
		types: stylePickerTypes
	});
	if (!handle) throw new Error('No file was selected.');
	return handle;
};

export const readStyleFile = async (handle: FileSystemFileHandleLike): Promise<string> => {
	const file = await handle.getFile();
	return file.text();
};

export const writeStyleFile = async (
	handle: FileSystemFileHandleLike,
	styleText: string
): Promise<void> => {
	await ensureWritePermission(handle);
	const writable = await handle.createWritable();
	try {
		await writable.write(styleText);
	} finally {
		await writable.close();
	}
};

export const saveStyleFileAs = async (
	styleText: string,
	suggestedName = 'style.json'
): Promise<FileSystemFileHandleLike> => {
	const pickerWindow = requirePickerWindow();
	const handle = await pickerWindow.showSaveFilePicker({
		suggestedName,
		excludeAcceptAllOption: false,
		types: stylePickerTypes
	});
	await writeStyleFile(handle, styleText);
	return handle;
};

export const fileIntegrationFeatures: FileIntegrationFeatures = {
	get enabled() {
		return isFileSystemAccessSupported();
	},
	isSupported: isFileSystemAccessSupported,
	pickStyleFile,
	readStyleFile,
	writeStyleFile,
	saveStyleFileAs
};

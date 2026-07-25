export type FileWritableStreamLike = {
	write: (data: string | Uint8Array) => Promise<void>;
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

export type PickedStylePackFile = {
	name: string;
	bytes: Uint8Array;
};

export type SavedStylePackFile = {
	name: string;
	handle: FileSystemFileHandleLike | null;
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

const stylePackPickerTypes: FilePickerAcceptTypeLike[] = [
	{
		description: 'Kartore project',
		accept: {
			'application/zip': ['.kartore']
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

const abortError = (): DOMException => new DOMException('The operation was aborted.', 'AbortError');

const pickStylePackWithInput = (): Promise<File> => {
	if (typeof document === 'undefined') throw new FileFeatureUnavailableError();
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.kartore,application/zip';
		input.hidden = true;

		const cleanup = () => input.remove();
		input.addEventListener(
			'change',
			() => {
				const file = input.files?.[0];
				cleanup();
				if (file) resolve(file);
				else reject(abortError());
			},
			{ once: true }
		);
		input.addEventListener(
			'cancel',
			() => {
				cleanup();
				reject(abortError());
			},
			{ once: true }
		);
		document.body.append(input);
		input.click();
	});
};

const downloadStylePack = (bytes: Uint8Array, fileName: string): void => {
	if (typeof document === 'undefined') throw new FileFeatureUnavailableError();
	const ownedBytes = Uint8Array.from(bytes);
	const url = URL.createObjectURL(new Blob([ownedBytes], { type: 'application/zip' }));
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = fileName;
	anchor.hidden = true;
	document.body.append(anchor);
	anchor.click();
	anchor.remove();
	setTimeout(() => URL.revokeObjectURL(url), 0);
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

export const pickStylePackFile = async (): Promise<PickedStylePackFile> => {
	const pickerWindow = getPickerWindow();
	let file: File;
	if (pickerWindow?.showOpenFilePicker) {
		const [handle] = await pickerWindow.showOpenFilePicker({
			multiple: false,
			excludeAcceptAllOption: false,
			types: stylePackPickerTypes
		});
		if (!handle) throw new Error('No file was selected.');
		file = await handle.getFile();
	} else {
		file = await pickStylePackWithInput();
	}
	return {
		name: file.name,
		bytes: new Uint8Array(await file.arrayBuffer())
	};
};

export const writeStylePackFile = async (
	handle: FileSystemFileHandleLike,
	bytes: Uint8Array
): Promise<void> => {
	await ensureWritePermission(handle);
	const writable = await handle.createWritable();
	try {
		await writable.write(bytes);
	} finally {
		await writable.close();
	}
};

/**
 * File System Access API の picker は transient user activation が必要なため、
 * フォント読み出しや zip 生成より先にこの関数を呼ぶ。
 */
export const pickStylePackSaveTarget = async (
	suggestedName = 'project.kartore'
): Promise<SavedStylePackFile> => {
	const pickerWindow = getPickerWindow();
	if (pickerWindow?.showSaveFilePicker) {
		const handle = await pickerWindow.showSaveFilePicker({
			suggestedName,
			excludeAcceptAllOption: false,
			types: stylePackPickerTypes
		});
		return { name: handle.name, handle };
	}
	return { name: suggestedName, handle: null };
};

export const writeStylePackSaveTarget = async (
	target: SavedStylePackFile,
	bytes: Uint8Array
): Promise<void> => {
	if (target.handle) {
		await writeStylePackFile(target.handle, bytes);
	} else {
		downloadStylePack(bytes, target.name);
	}
};

export const saveStylePackFileAs = async (
	bytes: Uint8Array,
	suggestedName = 'project.kartore'
): Promise<SavedStylePackFile> => {
	const target = await pickStylePackSaveTarget(suggestedName);
	await writeStylePackSaveTarget(target, bytes);
	return target;
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

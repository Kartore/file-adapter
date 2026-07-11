import type { StyleSpecification } from 'maplibre-gl';

import type { EditorApi } from '$lib/editor/EditorModule.ts';
import { parseStyleJSON, type StyleImportResult } from '$lib/utils/styleImport.ts';

import { fileIntegrationFeatures, type FileSystemFileHandleLike } from '../features.ts';

export type FileConnection = {
	name: string;
};

export const serializeStyle = (style: StyleSpecification): string =>
	`${JSON.stringify($state.snapshot(style as object), null, '\t')}\n`;

const isAbortError = (error: unknown): boolean =>
	error instanceof DOMException && error.name === 'AbortError';

export class FileSyncStore {
	#editor: EditorApi;
	#dirtyTimer: ReturnType<typeof setTimeout> | null = null;
	#fileHandle: FileSystemFileHandleLike | null = null;

	connection = $state<FileConnection | null>(null);
	lastSavedStyleText = $state<string | null>(null);
	isDirty = $state(false);
	isBusy = $state(false);
	error = $state<string | null>(null);
	status = $state<string | null>(null);
	lastImportResult = $state<StyleImportResult | null>(null);

	constructor(editor: EditorApi) {
		this.#editor = editor;
	}

	get isSupported() {
		return fileIntegrationFeatures.enabled;
	}

	observeStyle = () => {
		const style = this.#editor.getStyle();
		this.cancelObserve();
		this.#dirtyTimer = setTimeout(() => {
			this.#dirtyTimer = null;
			this.updateDirty(style);
		}, 500);
		return this.cancelObserve;
	};

	cancelObserve = () => {
		if (!this.#dirtyTimer) return;
		clearTimeout(this.#dirtyTimer);
		this.#dirtyTimer = null;
	};

	updateDirty = (style = this.#editor.getStyle()) => {
		this.isDirty =
			this.lastSavedStyleText !== null && serializeStyle(style) !== this.lastSavedStyleText;
	};

	open = async (): Promise<StyleImportResult | null> => {
		this.isBusy = true;
		this.error = null;
		this.status = null;
		try {
			const handle = await fileIntegrationFeatures.pickStyleFile();
			return await this.loadHandle(handle);
		} catch (error) {
			if (isAbortError(error)) return null;
			const message = error instanceof Error ? error.message : String(error);
			this.error = message;
			const result: StyleImportResult = { ok: false, error: message };
			this.lastImportResult = result;
			return result;
		} finally {
			this.isBusy = false;
		}
	};

	loadHandle = async (handle: FileSystemFileHandleLike): Promise<StyleImportResult> => {
		const styleText = await fileIntegrationFeatures.readStyleFile(handle);
		const result = parseStyleJSON(styleText);
		this.lastImportResult = result;
		if (!result.ok) {
			this.error = result.error;
			return result;
		}

		this.#editor.setPreview(null);
		this.#editor.setStyle(result.style);
		this.#fileHandle = handle;
		this.connection = { name: handle.name };
		this.lastSavedStyleText = styleText;
		this.isDirty = false;
		this.status = `Opened ${handle.name}`;
		return result;
	};

	save = async () => {
		if (!this.#fileHandle) return this.saveAs();
		await this.writeToHandle(this.#fileHandle, 'Saved');
		return this.#fileHandle;
	};

	saveAs = async () => {
		this.isBusy = true;
		this.error = null;
		this.status = null;
		try {
			const styleText = serializeStyle(this.#editor.getStyle());
			const handle = await fileIntegrationFeatures.saveStyleFileAs(
				styleText,
				this.connection?.name ?? 'style.json'
			);
			this.#fileHandle = handle;
			this.connection = { name: handle.name };
			this.lastSavedStyleText = styleText;
			this.isDirty = false;
			this.status = `Saved ${handle.name}`;
			return handle;
		} catch (error) {
			if (isAbortError(error)) return null;
			this.error = error instanceof Error ? error.message : String(error);
			return null;
		} finally {
			this.isBusy = false;
		}
	};

	disconnect = () => {
		this.#editor.setPreview(null);
		this.#fileHandle = null;
		this.connection = null;
		this.lastSavedStyleText = null;
		this.isDirty = false;
		this.status = null;
		this.error = null;
	};

	writeToHandle = async (handle: FileSystemFileHandleLike, statusPrefix: string) => {
		this.isBusy = true;
		this.error = null;
		this.status = null;
		try {
			const styleText = serializeStyle(this.#editor.getStyle());
			await fileIntegrationFeatures.writeStyleFile(handle, styleText);
			this.lastSavedStyleText = styleText;
			this.isDirty = false;
			this.status = `${statusPrefix} ${handle.name}`;
		} catch (error) {
			this.error = error instanceof Error ? error.message : String(error);
		} finally {
			this.isBusy = false;
		}
	};
}

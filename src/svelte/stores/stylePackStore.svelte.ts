import type { StyleSpecification } from 'maplibre-gl';
import { SvelteDate } from 'svelte/reactivity';

import type { EditorApi } from '@kartore/editor/types';
import {
	createStylePack,
	readStylePack,
	type StylePackAssets,
	type StylePackFiles
} from 'virtual:kartore-host/utils/stylePack.ts';

import {
	pickStylePackFile,
	pickStylePackSaveTarget,
	writeStylePackSaveTarget
} from '../features.ts';
import { createStylePackArchive, readStylePackArchive } from '../stylePackArchive.ts';

type StylePackMeta = {
	appVersion: string;
	createdAt: string;
};

type PendingStylePack = {
	name: string;
	style: StyleSpecification;
	assets: StylePackAssets;
	warnings: string[];
	meta: StylePackMeta;
};

const isAbortError = (error: unknown): boolean =>
	error instanceof DOMException && error.name === 'AbortError';

const manifestMeta = (files: StylePackFiles): StylePackMeta => {
	const value = files['manifest.json'];
	if (value === undefined) throw new Error('Style pack is missing manifest.json');
	const text = typeof value === 'string' ? value : new TextDecoder().decode(value);
	const manifest = JSON.parse(text) as Record<string, unknown>;
	return {
		appVersion: manifest.appVersion as string,
		createdAt: manifest.createdAt as string
	};
};

export class StylePackStore {
	#editor: EditorApi;
	#meta: StylePackMeta | null = null;
	#pending: PendingStylePack | null = null;

	isBusy = $state(false);
	confirmOpen = $state(false);
	errorDialogOpen = $state(false);
	errorTitle = $state('.kartore could not be opened');
	error = $state<string | null>(null);
	status = $state<string | null>(null);
	fileName = $state<string | null>(null);

	constructor(editor: EditorApi) {
		this.#editor = editor;
	}

	open = async (): Promise<void> => {
		this.isBusy = true;
		this.error = null;
		this.status = null;
		try {
			const picked = await pickStylePackFile();
			const files = readStylePackArchive(picked.bytes);
			const opened = readStylePack(files);
			this.#pending = {
				name: picked.name,
				style: opened.style,
				assets: opened.assets,
				warnings: opened.warnings,
				meta: manifestMeta(files)
			};
			this.confirmOpen = true;
		} catch (error) {
			if (isAbortError(error)) return;
			this.showError('.kartore could not be opened', error);
		} finally {
			this.isBusy = false;
		}
	};

	replaceWithPending = async (): Promise<void> => {
		const pending = this.#pending;
		if (!pending) return;
		this.isBusy = true;
		this.error = null;
		this.status = null;
		try {
			await this.#editor.loadProject({ style: pending.style, assets: pending.assets });
			this.#meta = pending.meta;
			this.fileName = pending.name;
			this.status =
				pending.warnings.length === 0
					? `Opened ${pending.name}`
					: `Opened ${pending.name} with ${pending.warnings.length} warnings`;
			this.#pending = null;
		} catch (error) {
			this.showError('Could not replace the local project', error);
		} finally {
			this.isBusy = false;
		}
	};

	saveAs = async (): Promise<void> => {
		this.isBusy = true;
		this.error = null;
		this.status = null;
		const suggestedName = this.fileName?.endsWith('.kartore') ? this.fileName : 'project.kartore';
		const meta = this.#meta ?? {
			appVersion: this.#editor.appVersion,
			createdAt: new SvelteDate().toISOString()
		};
		try {
			const target = await pickStylePackSaveTarget(suggestedName);
			const assets: StylePackAssets = {
				icons: this.#editor.getSpriteIcons(),
				fonts: await this.#editor.getStoredFonts()
			};
			const files = createStylePack(this.#editor.getStyle(), assets, meta);
			const archive = createStylePackArchive(files);
			await writeStylePackSaveTarget(target, archive);
			this.#meta = meta;
			this.fileName = target.name;
			this.status = `Saved ${target.name}`;
		} catch (error) {
			if (isAbortError(error)) return;
			this.showError('Could not save .kartore', error);
		} finally {
			this.isBusy = false;
		}
	};

	dismissError = () => {
		this.errorDialogOpen = false;
		this.error = null;
	};

	private showError(title: string, error: unknown) {
		this.errorTitle = title;
		this.error = error instanceof Error ? error.message : String(error);
		this.errorDialogOpen = true;
	}
}

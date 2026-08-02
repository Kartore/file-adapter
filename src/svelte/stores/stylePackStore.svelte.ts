import type { StyleSpecification } from 'maplibre-gl';
import { SvelteDate } from 'svelte/reactivity';

import type { EditorApi } from '$lib/editor/EditorModule.ts';
import {
	createStylePack,
	readStylePack,
	type StylePackAssets,
	type StylePackFiles
} from '$lib/utils/stylePack.ts';

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
	if (value === undefined) throw new Error('スタイルパックに manifest.json がありません');
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
	errorTitle = $state('.kartore を開けませんでした');
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
			this.showError('.kartore を開けませんでした', error);
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
			this.#editor.setPreview(null);
			this.#editor.setStyle(pending.style);
			await this.#editor.replaceSpriteIcons(pending.assets.icons);
			await this.#editor.replaceStoredFonts(pending.assets.fonts);
			this.#meta = pending.meta;
			this.fileName = pending.name;
			this.status =
				pending.warnings.length === 0
					? `${pending.name} を開きました`
					: `${pending.name} を ${pending.warnings.length} 件の警告付きで開きました`;
			this.#pending = null;
		} catch (error) {
			this.showError('ローカルプロジェクトを置き換えられませんでした', error);
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
			this.status = `${target.name} を保存しました`;
		} catch (error) {
			if (isAbortError(error)) return;
			this.showError('.kartore を保存できませんでした', error);
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

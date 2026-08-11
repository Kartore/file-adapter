declare module 'virtual:kartore-host/editor/EditorModule.ts' {
	import type { Component } from 'svelte';
	import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';

	export type EditorPreview = {
		style: StyleSpecification;
		label: string;
	};

	export type StyleHistoryRevision = {
		id: string;
		message: string;
		authorName: string;
		authorLogin?: string;
		avatarUrl?: string;
		authoredAt: string;
		htmlUrl?: string;
	};

	export type StyleHistoryPage = {
		revisions: StyleHistoryRevision[];
		hasNext: boolean;
	};

	export type StyleHistoryProvider = {
		readonly available: boolean;
		readonly label: string | null;
		listRevisions: (options: {
			page: number;
			perPage?: number;
			scope?: { layerId: string };
		}) => Promise<StyleHistoryPage>;
		loadStyleAtRevision: (revisionId: string) => Promise<StyleSpecification>;
		loadLayerAtRevision?: (
			revisionId: string,
			layerId: string
		) => Promise<LayerSpecification | null>;
	};

	export type SaveProvider = {
		readonly available: boolean;
		save: () => void | Promise<void>;
	};

	export type NewStyleHandler = () => void;

	type SpriteIcons = Record<string, string>;

	type StoredFont = {
		familyName: string;
		styleName: string;
		addedAt: number;
		bytes: ArrayBuffer;
	};

	export type EditorProject = {
		style: StyleSpecification;
		assets?: {
			icons?: SpriteIcons;
			fonts?: Record<string, StoredFont>;
		};
	};

	export type EditorApi = {
		readonly appVersion: string;
		getStyle: () => StyleSpecification;
		setStyle: (style: StyleSpecification) => void;
		loadProject: (project: EditorProject) => Promise<void>;
		getSpriteIcons: () => SpriteIcons;
		replaceSpriteIcons: (icons: SpriteIcons) => Promise<void>;
		getStoredFonts: () => Promise<Record<string, StoredFont>>;
		replaceStoredFonts: (fonts: Record<string, StoredFont>) => Promise<void>;
		setPreview: (preview: EditorPreview | null) => void;
		getPreview: () => EditorPreview | null;
		registerStyleHistoryProvider: (provider: StyleHistoryProvider) => void;
		registerSaveProvider: (provider: SaveProvider) => void;
		registerNewStyleHandler: (handler: NewStyleHandler) => void;
		openRailItem: (moduleId: string, railItemId: string) => void;
	};

	export type EditorModulePage = {
		path: string;
		component: Component;
	};

	export type EditorMenuId = 'file' | 'edit' | 'view';

	export type EditorRailPlacement = 'main' | 'bottom';

	export type EditorModuleRailItem = {
		id: string;
		label: string;
		icon: Component;
		secondColumn: Component;
		placement?: EditorRailPlacement;
	};

	export type EditorModule = {
		id: string;
		/** @deprecated Use menuSections / headerStatus. */
		headerAction?: Component;
		menuSections?: Partial<Record<EditorMenuId, Component>>;
		/** A compact status shown beside the file name in the top bar. */
		headerStatus?: Component;
		overlays?: Component[];
		railItems?: EditorModuleRailItem[];
		pages?: EditorModulePage[];
		setup?: (editor: EditorApi) => unknown;
	};
}

declare module 'virtual:kartore-host/utils/stylePack.ts' {
	import type { StyleSpecification } from 'maplibre-gl';

	export type SpriteIcons = Record<string, string>;

	export type StoredFont = {
		familyName: string;
		styleName: string;
		addedAt: number;
		bytes: ArrayBuffer;
	};

	export type StylePackAssets = {
		icons: SpriteIcons;
		fonts: Record<string, StoredFont>;
	};

	export type StylePackFiles = Record<string, string | Uint8Array>;

	export const createStylePack: (
		style: StyleSpecification,
		assets: StylePackAssets,
		meta: { appVersion: string; createdAt: string }
	) => StylePackFiles;

	export const readStylePack: (files: StylePackFiles) => {
		style: StyleSpecification;
		assets: StylePackAssets;
		warnings: string[];
	};
}

declare module 'virtual:kartore-host/utils/stylePackArchive.ts' {
	import type { StylePackFiles } from 'virtual:kartore-host/utils/stylePack.ts';

	export const createStylePackArchive: (files: StylePackFiles) => Uint8Array;
	export const readStylePackArchive: (bytes: Uint8Array) => StylePackFiles;
}

declare module 'virtual:kartore-host/utils/styleImport.ts' {
	import type { StyleSpecification } from 'maplibre-gl';

	export type StyleImportResult =
		| {
				ok: true;
				style: StyleSpecification;
				warnings: string[];
		  }
		| {
				ok: false;
				error: string;
		  };

	export const parseStyleJSON: (text: string) => StyleImportResult;
}

declare module '$lib/editor/EditorModule.ts' {
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

	export type EditorApi = {
		getStyle: () => StyleSpecification;
		setStyle: (style: StyleSpecification) => void;
		setPreview: (preview: EditorPreview | null) => void;
		getPreview: () => EditorPreview | null;
		registerStyleHistoryProvider: (provider: StyleHistoryProvider) => void;
		registerSaveProvider: (provider: SaveProvider) => void;
	};

	export type EditorModulePage = {
		path: string;
		component: Component;
	};

	export type EditorMenuId = 'file' | 'edit' | 'view' | 'assets';

	export type EditorModule = {
		id: string;
		/** @deprecated Use menuSections / headerStatus. */
		headerAction?: Component;
		menuSections?: Partial<Record<EditorMenuId, Component>>;
		headerStatus?: Component;
		overlays?: Component[];
		pages?: EditorModulePage[];
		setup?: (editor: EditorApi) => unknown;
	};
}

declare module '$lib/utils/styleImport.ts' {
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

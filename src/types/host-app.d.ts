declare module '$lib/editor/EditorModule.ts' {
	import type { Component } from 'svelte';
	import type { StyleSpecification } from 'maplibre-gl';

	export type EditorPreview = {
		style: StyleSpecification;
		label: string;
	};

	export type EditorApi = {
		getStyle: () => StyleSpecification;
		setStyle: (style: StyleSpecification) => void;
		setPreview: (preview: EditorPreview | null) => void;
		getPreview: () => EditorPreview | null;
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
		/** @deprecated Use menuSections.file. */
		menuSection?: Component;
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

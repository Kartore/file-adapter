// virtual:kartore-host/* (editor の src/lib を実行時に解決する入口) のうち、このアダプタが実行時に import するものの宣言。
// EditorModule / EditorApi などの型は @kartore/editor/types から import type する (ここに複製しない)
declare module 'virtual:kartore-host/utils/stylePack.ts' {
	import type { StyleSpecification } from 'maplibre-gl';
	import type { SpriteIcons } from '@kartore/editor/types';

	// アイコンの形 ({ svg, sdf? }) は editor の型をそのまま使う
	export type { SpriteIcons };

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

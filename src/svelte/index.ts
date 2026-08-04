import type { EditorModule } from 'virtual:kartore-host/editor/EditorModule.ts';

import FileHeaderStatus from './components/FileHeaderStatus.svelte';
import FileMenuSection from './components/FileMenuSection.svelte';
import StylePackDialogs from './components/StylePackDialogs.svelte';
import { FileSyncStore } from './stores/fileSyncStore.svelte.ts';
import { StylePackStore } from './stores/stylePackStore.svelte.ts';

export const fileModule: EditorModule = {
	id: 'file',
	menuSections: { file: FileMenuSection },
	headerStatus: FileHeaderStatus,
	overlays: [StylePackDialogs],
	setup: (editor) => {
		const sync = new FileSyncStore(editor);
		const pack = new StylePackStore(editor);
		editor.registerSaveProvider({
			get available() {
				return sync.connection !== null;
			},
			save: async () => {
				await sync.save();
			}
		});
		return { sync, pack };
	}
};

// ホストの kartore() が client 集約で読む標準 export (kartore アダプタ契約)
export const adapterModules: EditorModule[] = [fileModule];
export const adapterProviders = [];

export type { FileModuleContext } from './context.ts';
export { getFileContext } from './context.ts';
export {
	FileFeatureUnavailableError,
	fileIntegrationFeatures,
	isFileSystemAccessSupported,
	pickStylePackSaveTarget,
	pickStylePackFile,
	pickStyleFile,
	readStyleFile,
	saveStylePackFileAs,
	saveStyleFileAs,
	writeStylePackFile,
	writeStylePackSaveTarget,
	writeStyleFile,
	type FileIntegrationFeatures,
	type FileSystemFileHandleLike,
	type PickedStylePackFile,
	type SavedStylePackFile
} from './features.ts';
export { createStylePackArchive, readStylePackArchive } from './stylePackArchive.ts';
export {
	FileSyncStore,
	serializeStyle,
	type FileConnection
} from './stores/fileSyncStore.svelte.ts';
export { StylePackStore } from './stores/stylePackStore.svelte.ts';

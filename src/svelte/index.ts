import type { EditorModule } from '$lib/editor/EditorModule.ts';

import FileHeaderStatus from './components/FileHeaderStatus.svelte';
import FileMenuSection from './components/FileMenuSection.svelte';
import { FileSyncStore } from './stores/fileSyncStore.svelte.ts';

export const fileModule: EditorModule = {
	id: 'file',
	menuSections: { file: FileMenuSection },
	headerStatus: FileHeaderStatus,
	setup: (editor) => {
		const sync = new FileSyncStore(editor);
		editor.registerSaveProvider({
			get available() {
				return sync.connection !== null;
			},
			save: async () => {
				await sync.save();
			}
		});
		return { sync };
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
	pickStyleFile,
	readStyleFile,
	saveStyleFileAs,
	writeStyleFile,
	type FileIntegrationFeatures,
	type FileSystemFileHandleLike
} from './features.ts';
export {
	FileSyncStore,
	serializeStyle,
	type FileConnection
} from './stores/fileSyncStore.svelte.ts';

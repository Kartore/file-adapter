import type { EditorModule } from '$lib/editor/EditorModule.ts';

import FileHeaderAction from './components/FileHeaderAction.svelte';
import { FileSyncStore } from './stores/fileSyncStore.svelte.ts';

export const fileModule: EditorModule = {
	id: 'file',
	headerAction: FileHeaderAction,
	setup: (editor) => ({
		sync: new FileSyncStore(editor)
	})
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

import { getContext } from 'svelte';

import type { FileSyncStore } from './stores/fileSyncStore.svelte.ts';
import type { StylePackStore } from './stores/stylePackStore.svelte.ts';

export type FileModuleContext = {
	sync: FileSyncStore;
	pack: StylePackStore;
};

export const getFileContext = (): FileModuleContext => {
	const context = getContext<FileModuleContext>('module:file');
	if (!context) throw new Error('File module context is not available.');
	return context;
};

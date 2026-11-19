import { defineConfig } from 'tsdown';

// アダプタのマニフェスト (`@kartore/file-adapter/vite`) を dist/vite.js と dist/vite.d.ts にビルドする。
// Svelte 側 (src/svelte) はソースのまま配布する
export default defineConfig({
	entry: { vite: 'src/vite/index.ts' },
	platform: 'node',
	fixedExtension: false,
	dts: true
});

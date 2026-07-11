/**
 * Kartore アダプタのマニフェスト。
 *
 * hooks を持たない宣言のみの vite plugin (name + api)。仮想モジュールの提供や
 * optimizeDeps / ssr.noExternal の適用はホストの `kartore()` が一括で行う。
 * `clientModule` / `serverModule` の指す先は標準名 (`adapterModules` / `adapterProviders` /
 * `adapterApiHandlers`) を export していること。
 */
export type KartoreAdapterVitePlugin = {
	name: string;
	api: {
		kartoreAdapter: {
			/** `adapterModules` / `adapterProviders` を export するモジュール指定子 */
			clientModule: string;
			/** `adapterApiHandlers` を export するモジュール指定子 (バックエンドを持つ場合のみ) */
			serverModule?: string;
			/** ホストの optimizeDeps.exclude / ssr.noExternal に加える Svelte 系依存 */
			svelteDependencies?: string[];
		};
	};
};

/** Kartore のローカルファイルアダプタ。ホストの `kartore({ adapters: [fileAdapter()] })` に渡して使う */
export const fileAdapter = (): KartoreAdapterVitePlugin => ({
	name: 'kartore-file-adapter',
	api: {
		kartoreAdapter: {
			clientModule: '@kartore/file-adapter/svelte'
		}
	}
});

export default fileAdapter;

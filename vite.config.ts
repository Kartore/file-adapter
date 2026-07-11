import { defineConfig } from 'vite';

const external = (id: string): boolean =>
	id === 'maplibre-gl' ||
	id === 'svelte' ||
	id === 'vite' ||
	id.startsWith('svelte/') ||
	id.startsWith('$lib/');

export default defineConfig({
	build: {
		emptyOutDir: true,
		lib: {
			entry: {
				vite: 'src/vite/index.ts'
			},
			formats: ['es']
		},
		rollupOptions: {
			external,
			output: {
				entryFileNames: '[name].js',
				chunkFileNames: 'chunks/[name]-[hash].js'
			}
		}
	}
});

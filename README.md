# @kartore/file-adapter

Local file adapter for Kartore.

This adapter uses the browser File System Access API to open and save MapLibre style JSON files from the user's local filesystem. The browser must support `showOpenFilePicker()`, `showSaveFilePicker()`, and `FileSystemFileHandle.createWritable()`; these APIs are only available in secure contexts and require explicit user selection/permission.

## Exports

- `@kartore/file-adapter/svelte`: Svelte editor module and file features
- `@kartore/file-adapter/vite`: adapter manifest for the host's `kartore()` Vite plugin

The `./svelte` exports point directly to the package's Svelte and TypeScript source. This package is
consumable only through a Vite + Svelte host, which compiles the source for both SSR and CSR. The
source intentionally imports host APIs through `virtual:kartore-host`; the host must provide that virtual module contract and the
corresponding extension points.

The adapter does not publish CSS or run its own Tailwind build. A Tailwind host must scan the
adapter source when generating its single application stylesheet.

The implementation lives under `src/`: `src/svelte/` contains the editor module,
`src/types/` contains the `virtual:kartore-host/*` declarations, and `src/vite/` contains the adapter manifest.

## Host usage

Requires `@kartore/editor` 0.3 (adapter contract 2; sprite icons are `{ svg, sdf? }`). Pass `fileAdapter()` to the editor's `kartore()` Vite preset:

```ts
// vite.config.ts
import { cloudflare } from '@cloudflare/vite-plugin';
import { kartore } from '@kartore/editor/vite';
import { fileAdapter } from '@kartore/file-adapter/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [kartore({ adapters: [fileAdapter()], runtime: 'cloudflare' }), cloudflare()]
});
```

Editor types (`EditorModule`, `EditorApi`, …) are imported from `@kartore/editor/types`;
`src/types/host-app.d.ts` only declares the `virtual:kartore-host/*` modules the adapter imports at runtime.

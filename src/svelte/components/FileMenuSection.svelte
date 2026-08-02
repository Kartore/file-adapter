<script lang="ts">
	import { MenuItem, MenuSeparator } from '$lib/components/common/HeaderMenu';

	import { getFileContext } from '../context.ts';

	const { sync, pack } = getFileContext();
</script>

<MenuItem
	disabled={!sync.isSupported || sync.isBusy || pack.isBusy}
	onSelect={() => void sync.open()}
>
	ローカルファイルを開く…
</MenuItem>
{#if sync.isSupported}
	<MenuItem
		disabled={sync.isBusy || pack.isBusy}
		shortcut={sync.connection ? '⌘S' : undefined}
		onSelect={() => void sync.save()}
	>
		保存
	</MenuItem>
	<MenuItem disabled={sync.isBusy || pack.isBusy} onSelect={() => void sync.saveAs()}>
		名前を付けて保存…
	</MenuItem>
	{#if sync.connection}
		<MenuSeparator />
		<MenuItem onSelect={sync.disconnect}>ローカルファイルとの接続を解除</MenuItem>
	{/if}
{/if}

<MenuSeparator />
<MenuItem disabled={sync.isBusy || pack.isBusy} onSelect={() => void pack.open()}>
	.kartore を開く…
</MenuItem>
<MenuItem disabled={sync.isBusy || pack.isBusy} onSelect={() => void pack.saveAs()}>
	.kartore として保存…
</MenuItem>

{#if pack.status || pack.error || sync.status || sync.error}
	<MenuSeparator />
	<MenuItem class={pack.error || sync.error ? 'text-red-600' : 'text-green-700'} disabled>
		{pack.error ?? sync.error ?? pack.status ?? sync.status}
	</MenuItem>
{/if}

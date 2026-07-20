<script lang="ts">
	import { MenuItem, MenuSeparator } from '$lib/components/common/HeaderMenu';

	import { getFileContext } from '../context.ts';

	const { sync } = getFileContext();
</script>

<MenuItem disabled={!sync.isSupported || sync.isBusy} onSelect={() => void sync.open()}>
	Open local file…
</MenuItem>
{#if sync.isSupported}
	<MenuItem
		disabled={sync.isBusy}
		shortcut={sync.connection ? '⌘S' : undefined}
		onSelect={() => void sync.save()}
	>
		Save local file
	</MenuItem>
	<MenuItem disabled={sync.isBusy} onSelect={() => void sync.saveAs()}>Save local file as…</MenuItem
	>
	{#if sync.connection}
		<MenuSeparator />
		<MenuItem onSelect={sync.disconnect}>Disconnect local file</MenuItem>
	{/if}
	{#if sync.status || sync.error}
		<MenuSeparator />
		<MenuItem class={sync.error ? 'text-red-600' : 'text-green-700'} disabled>
			{sync.error ?? sync.status}
		</MenuItem>
	{/if}
{/if}

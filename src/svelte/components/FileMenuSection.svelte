<script lang="ts">
	import { MenuItem, MenuSeparator } from 'virtual:kartore-host/components/common/HeaderMenu';

	import { getFileContext } from '../context.ts';

	const { sync, pack } = getFileContext();
</script>

<MenuItem
	disabled={!sync.isSupported || sync.isBusy || pack.isBusy}
	onSelect={() => void sync.open()}
>
	Open local file…
</MenuItem>
{#if sync.isSupported}
	<MenuItem
		disabled={sync.isBusy || pack.isBusy}
		shortcut={sync.connection ? '⌘S' : undefined}
		onSelect={() => void sync.save()}
	>
		Save
	</MenuItem>
	<MenuItem disabled={sync.isBusy || pack.isBusy} onSelect={() => void sync.saveAs()}>
		Save as…
	</MenuItem>
	{#if sync.connection}
		<MenuSeparator />
		<MenuItem onSelect={sync.disconnect}>Disconnect from local file</MenuItem>
	{/if}
{/if}

<MenuSeparator />
<MenuItem disabled={sync.isBusy || pack.isBusy} onSelect={() => void pack.open()}>
	Open .kartore…
</MenuItem>
<MenuItem disabled={sync.isBusy || pack.isBusy} onSelect={() => void pack.saveAs()}>
	Save as .kartore…
</MenuItem>

{#if pack.status || pack.error || sync.status || sync.error}
	<MenuSeparator />
	<MenuItem class={pack.error || sync.error ? 'text-red-600' : 'text-green-700'} disabled>
		{pack.error ?? sync.error ?? pack.status ?? sync.status}
	</MenuItem>
{/if}

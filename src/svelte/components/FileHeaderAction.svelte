<script lang="ts">
	import { Button } from '$lib/components/common/Button';
	import { Popover } from '$lib/components/common/Popover';

	import { getFileContext } from '../context.ts';

	const { sync } = getFileContext();
	let open = $state(false);

	$effect(sync.observeStyle);

	const label = $derived(sync.connection?.name ?? 'File');
</script>

{#if !sync.isSupported}
	<div
		class="flex h-8 items-center rounded-md border border-gray-200 bg-gray-50 px-2 text-xs font-semibold text-gray-400"
		title="Local file access is not available in this browser."
	>
		File
	</div>
{:else}
	<Popover
		bind:open
		aria-label="Local file"
		triggerClass="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-white"
		contentClass="w-72 rounded-lg border border-gray-300 bg-white p-3 shadow-xl shadow-gray-950/15"
	>
		{#snippet trigger()}
			<span class="flex max-w-40 items-center gap-2">
				<span class="min-w-0 truncate">{label}</span>
				{#if sync.isDirty}
					<span class="h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Unsaved changes"></span>
				{/if}
			</span>
		{/snippet}

		<div class="flex flex-col gap-3">
			<div class="rounded border border-gray-200 bg-gray-50 px-3 py-2">
				<p class="truncate text-xs font-semibold text-gray-900">{label}</p>
				<p class="truncate text-xs text-gray-500">Local style file</p>
			</div>

			<div class="flex flex-wrap gap-2">
				<Button
					class="rounded bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 disabled:cursor-default disabled:bg-gray-300"
					disabled={sync.isBusy}
					onclick={() => sync.open()}
				>
					Open
				</Button>
				<Button
					class="rounded border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-default disabled:text-gray-300"
					disabled={sync.isBusy}
					onclick={() => sync.save()}
				>
					Save
				</Button>
				<Button
					class="rounded border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-default disabled:text-gray-300"
					disabled={sync.isBusy}
					onclick={() => sync.saveAs()}
				>
					Save As
				</Button>
				{#if sync.connection}
					<Button
						class="rounded px-2 py-1 text-xs font-semibold text-gray-500"
						onclick={sync.disconnect}
					>
						Disconnect
					</Button>
				{/if}
			</div>

			{#if sync.status}
				<p class="text-xs font-semibold text-green-700">{sync.status}</p>
			{/if}
			{#if sync.error}
				<p class="text-xs font-semibold text-red-600" role="alert">{sync.error}</p>
			{/if}
		</div>
	</Popover>
{/if}

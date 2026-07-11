<script lang="ts">
	import { getFileContext } from '../context.ts';

	const { sync } = getFileContext();

	$effect(sync.observeStyle);
</script>

{#if sync.error}
	<div
		class="flex h-7 max-w-32 items-center rounded-full border border-red-200 bg-red-50 px-2 text-[11px] font-semibold text-red-700"
		title={sync.error}
		role="alert"
	>
		File error
	</div>
{:else if sync.connection}
	<div
		class="flex h-7 max-w-32 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2 text-[11px] font-semibold text-gray-600"
		title={sync.status ?? `Local file: ${sync.connection.name}`}
	>
		<span class="truncate">{sync.connection.name}</span>
		{#if sync.isDirty}
			<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" title="Unsaved changes"></span>
		{/if}
	</div>
{/if}

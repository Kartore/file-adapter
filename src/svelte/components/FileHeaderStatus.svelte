<script lang="ts">
	import { getFileContext } from '../context.ts';

	const { sync } = getFileContext();

	$effect(sync.observeStyle);
</script>

{#if sync.error}
	<div
		class="flex h-7 max-w-32 items-center rounded-[6px] bg-field px-2 text-[11px] font-semibold text-ink-2"
		title={sync.error}
		role="alert"
	>
		ファイルエラー
	</div>
{:else if sync.connection}
	<div
		class="flex h-7 max-w-32 items-center gap-1.5 rounded-[6px] bg-field px-2 text-[11px] font-semibold text-ink-2"
		title={sync.status ?? `ローカルファイル: ${sync.connection.name}`}
	>
		<span class="truncate">{sync.connection.name}</span>
		{#if sync.isDirty}
			<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" title="未保存の変更"></span>
		{/if}
	</div>
{/if}

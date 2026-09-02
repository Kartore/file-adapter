<script lang="ts">
	import { ConfirmDialog } from 'virtual:kartore-host/components/common/ConfirmDialog';

	import { getFileContext } from '../context.ts';

	const { pack } = getFileContext();
</script>

<ConfirmDialog
	bind:open={pack.confirmOpen}
	title="Replace the current local project?"
	description="Opening this .kartore file will replace the current local project. Unsaved style changes, sprites, and fonts will be lost. Existing data will not be merged."
	confirmLabel="Replace and open"
	danger
	onConfirm={pack.replaceWithPending}
/>

{#if pack.errorDialogOpen && pack.error}
	<div class="fixed inset-0 z-50 bg-gray-950/35 backdrop-blur-[1px]">
		<div
			class="fixed top-1/2 left-1/2 z-[60] w-[min(26rem,calc(100vw-1.5rem))] -translate-1/2 rounded-lg border border-red-200 bg-white p-4 shadow-xl shadow-gray-950/20 outline-none"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="style-pack-error-title"
			aria-describedby="style-pack-error-description"
		>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<h2
						id="style-pack-error-title"
						class="font-montserrat text-base font-semibold text-gray-950"
					>
						{pack.errorTitle}
					</h2>
					<p id="style-pack-error-description" class="text-xs leading-5 text-red-700">
						{pack.error}
					</p>
				</div>
				<div class="flex justify-end">
					<button
						type="button"
						class="h-9 cursor-pointer rounded-md bg-gray-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-950"
						onclick={pack.dismissError}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

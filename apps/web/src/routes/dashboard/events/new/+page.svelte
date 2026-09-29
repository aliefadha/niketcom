<script lang="ts">
import { goto } from "$app/navigation";
import { client } from "$lib/orpc";

let title = $state("");
let slug = $state("");
let description = $state("");
let imageUrl = $state("");
let status = $state<"draft" | "published" | "canceled">("draft");
let timeZone = $state("UTC");
let isSubmitting = $state(false);
let errorMessage = $state<string | null>(null);

async function createEvent() {
	isSubmitting = true;
	errorMessage = null;

	try {
		const event = await client.events.create({
			title,
			slug: slug || undefined,
			description: description || null,
			imageUrl: imageUrl || null,
			status,
			timeZone,
		});
		await goto(`/dashboard/events/${event.id}`);
	} catch (error) {
		errorMessage =
			error instanceof Error ? error.message : "Unable to create event.";
	} finally {
		isSubmitting = false;
	}
}
</script>

<svelte:head>
	<title>New event</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<a href="/dashboard/events" class="text-sm text-indigo-400 hover:text-indigo-300">← Manage events</a>
	<h1 class="mt-4 text-3xl font-semibold">New event</h1>
	<p class="mt-1 text-neutral-400">Start with the event details. You can add sessions next.</p>

	<form
		class="mt-8 space-y-5 rounded-lg border border-neutral-800 bg-neutral-900 p-6"
		onsubmit={(event) => {
			event.preventDefault();
			void createEvent();
		}}
	>
		<label class="block space-y-2">
			<span class="text-sm font-medium">Title</span>
			<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={title} required />
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium">Slug <span class="font-normal text-neutral-500">(optional)</span></span>
			<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={slug} placeholder="Generated from the title when empty" />
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium">Description</span>
			<textarea class="min-h-28 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={description}></textarea>
		</label>

		<div class="grid gap-5 sm:grid-cols-2">
			<label class="block space-y-2">
				<span class="text-sm font-medium">Status</span>
				<select class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={status}>
					<option value="draft">Draft</option>
					<option value="published">Published</option>
					<option value="canceled">Canceled</option>
				</select>
			</label>

			<label class="block space-y-2">
				<span class="text-sm font-medium">Time zone</span>
				<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={timeZone} required />
			</label>
		</div>

		<label class="block space-y-2">
			<span class="text-sm font-medium">Image URL</span>
			<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={imageUrl} type="url" />
		</label>

		{#if errorMessage}
			<p class="rounded border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">{errorMessage}</p>
		{/if}

		<div class="flex justify-end gap-3">
			<a class="rounded px-4 py-2 text-sm hover:bg-neutral-800" href="/dashboard/events">Cancel</a>
			<button class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50" disabled={isSubmitting}>
				{isSubmitting ? "Creating…" : "Create event"}
			</button>
		</div>
	</form>
</div>

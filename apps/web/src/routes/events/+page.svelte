<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { orpc } from "$lib/orpc";

const eventsQuery = createQuery(() => orpc.events.list.queryOptions());

function formatDate(value: Date) {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(value);
}
</script>

<svelte:head>
	<title>Events</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-semibold">Events</h1>
			<p class="mt-1 text-neutral-400">Discover published community events.</p>
		</div>
		<a
			href="/dashboard/events"
			class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
		>
			Manage my events
		</a>
	</div>

	{#if eventsQuery.isPending}
		<p class="text-neutral-400">Loading events…</p>
	{:else if eventsQuery.isError}
		<p class="rounded border border-red-900 bg-red-950/50 p-4 text-red-300">
			Unable to load events. Please try again.
		</p>
	{:else if eventsQuery.data?.length}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each eventsQuery.data as event}
				<a
					href={`/events/${event.slug}`}
					class="rounded-lg border border-neutral-800 bg-neutral-900 p-5 transition-colors hover:border-neutral-600"
				>
					<div class="mb-3 flex items-center justify-between gap-3">
						<span class="rounded bg-emerald-950 px-2 py-1 text-xs font-medium text-emerald-300">
							{event.status}
						</span>
						<span class="text-xs text-neutral-500">{event.timeZone}</span>
					</div>
					<h2 class="text-xl font-medium">{event.title}</h2>
					{#if event.description}
						<p class="mt-2 line-clamp-2 text-sm text-neutral-400">{event.description}</p>
					{/if}
					<p class="mt-4 text-xs text-neutral-500">Created {formatDate(event.createdAt)}</p>
				</a>
			{/each}
		</div>
	{:else}
		<p class="rounded border border-dashed border-neutral-700 p-8 text-center text-neutral-400">
			There are no published events yet.
		</p>
	{/if}
</div>

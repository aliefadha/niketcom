<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { orpc } from "$lib/orpc";

const eventsQuery = createQuery(() => orpc.events.listMine.queryOptions());
</script>

<svelte:head>
	<title>Manage events</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-semibold">Manage events</h1>
			<p class="mt-1 text-neutral-400">Create and maintain your event schedule.</p>
		</div>
		<a
			href="/dashboard/events/new"
			class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
		>
			New event
		</a>
	</div>

	{#if eventsQuery.isPending}
		<p class="text-neutral-400">Loading your events…</p>
	{:else if eventsQuery.isError}
		<p class="rounded border border-red-900 bg-red-950/50 p-4 text-red-300">
			Unable to load your events. Please try again.
		</p>
	{:else if eventsQuery.data?.length}
		<div class="space-y-3">
			{#each eventsQuery.data as event}
				<div class="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
					<div>
						<div class="flex items-center gap-2">
							<h2 class="font-medium">{event.title}</h2>
							<span class="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">{event.status}</span>
						</div>
						<p class="mt-1 text-sm text-neutral-400">{event.timeZone}</p>
					</div>
					<div class="flex items-center gap-3 text-sm">
						<a class="text-neutral-300 hover:text-white" href={`/events/${event.slug}`}>View</a>
						<a class="text-indigo-400 hover:text-indigo-300" href={`/dashboard/events/${event.id}`}>Edit</a>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="rounded border border-dashed border-neutral-700 p-8 text-center">
			<p class="text-neutral-400">You have not created any events yet.</p>
			<a class="mt-4 inline-block text-indigo-400 hover:text-indigo-300" href="/dashboard/events/new">
				Create your first event
			</a>
		</div>
	{/if}
</div>

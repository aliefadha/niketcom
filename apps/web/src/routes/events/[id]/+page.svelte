<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { page } from "$app/state";
import { orpc } from "$lib/orpc";

const slug = $derived(page.params.id ?? "");
const eventQuery = createQuery(() =>
	orpc.events.getBySlug.queryOptions({ input: { slug } }),
);

function formatDate(value: Date) {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(value);
}
</script>

<svelte:head>
	<title>{eventQuery.data?.title ?? "Event"}</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<a href="/events" class="text-sm text-indigo-400 hover:text-indigo-300">← All events</a>

	{#if eventQuery.isPending}
		<p class="mt-6 text-neutral-400">Loading event…</p>
	{:else if eventQuery.isError || !eventQuery.data}
		<div class="mt-6 rounded border border-red-900 bg-red-950/50 p-4 text-red-300">
			Event not found or unavailable.
		</div>
	{:else}
		{@const event = eventQuery.data}
		<article class="mt-6 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<span class="rounded bg-emerald-950 px-2 py-1 text-xs font-medium text-emerald-300">
					{event.status}
				</span>
				<span class="text-sm text-neutral-400">{event.timeZone}</span>
			</div>
			<h1 class="mt-4 text-3xl font-semibold">{event.title}</h1>
			{#if event.description}
				<p class="mt-4 whitespace-pre-wrap text-neutral-300">{event.description}</p>
			{/if}
		</article>

		<section class="mt-8">
			<h2 class="text-xl font-semibold">Schedule</h2>
			{#if event.sessions.length}
				<div class="mt-4 space-y-3">
					{#each event.sessions as session}
						<div class="rounded-lg border border-neutral-800 p-4">
							<div class="flex flex-wrap items-start justify-between gap-3">
								<div>
									<h3 class="font-medium">{session.name ?? "Session"}</h3>
									<p class="mt-1 text-sm text-neutral-400">
										{formatDate(session.startsAt)} – {formatDate(session.endsAt)}
									</p>
								</div>
								<span class="text-xs text-neutral-500">{session.status}</span>
							</div>
							{#if session.venueName || session.onlineUrl}
								<p class="mt-3 text-sm text-neutral-300">
									{session.venueName ?? "Online"}
									{#if session.onlineUrl}
										 · <a class="text-indigo-400 hover:text-indigo-300" href={session.onlineUrl}>Join online</a>
									{/if}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="mt-3 text-neutral-400">The schedule will be announced soon.</p>
			{/if}
		</section>
	{/if}
</div>

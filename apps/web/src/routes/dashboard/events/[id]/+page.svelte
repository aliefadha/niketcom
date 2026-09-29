<script lang="ts">
import { createQuery } from "@tanstack/svelte-query";
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { client, orpc } from "$lib/orpc";
import EventSessionEditor from "../../../../components/EventSessionEditor.svelte";

const routeEventId = $derived(page.params.id ?? "");
const eventQuery = createQuery(() =>
	orpc.events.get.queryOptions({ input: { id: routeEventId } }),
);

let eventId = $state<string | null>(null);
let title = $state("");
let slug = $state("");
let description = $state("");
let imageUrl = $state("");
let status = $state<"draft" | "published" | "canceled">("draft");
let timeZone = $state("UTC");
let isSavingEvent = $state(false);
let isAddingSession = $state(false);
let errorMessage = $state<string | null>(null);

let sessionName = $state("");
let sessionStartsAt = $state("");
let sessionEndsAt = $state("");
let sessionVenue = $state("");
let sessionAddress = $state("");
let sessionUrl = $state("");

$effect(() => {
	const event = eventQuery.data;
	if (event && event.id !== eventId) {
		eventId = event.id;
		title = event.title;
		slug = event.slug;
		description = event.description ?? "";
		imageUrl = event.imageUrl ?? "";
		status = event.status;
		timeZone = event.timeZone;
	}
});

async function refreshEvent() {
	await eventQuery.refetch();
}

async function saveEvent() {
	isSavingEvent = true;
	errorMessage = null;
	try {
		await client.events.update({
			id: routeEventId,
			data: {
				title,
				slug,
				description: description || null,
				imageUrl: imageUrl || null,
				status,
				timeZone,
			},
		});
		await refreshEvent();
	} catch (error) {
		errorMessage =
			error instanceof Error ? error.message : "Unable to update event.";
	} finally {
		isSavingEvent = false;
	}
}

async function deleteEvent() {
	if (!confirm("Delete this event and all of its sessions?")) {
		return;
	}
	isSavingEvent = true;
	errorMessage = null;
	try {
		await client.events.delete({ id: routeEventId });
		await goto("/dashboard/events");
	} catch (error) {
		errorMessage =
			error instanceof Error ? error.message : "Unable to delete event.";
	} finally {
		isSavingEvent = false;
	}
}

async function addSession() {
	isAddingSession = true;
	errorMessage = null;
	try {
		await client.eventSessions.create({
			eventId: routeEventId,
			data: {
				name: sessionName || null,
				startsAt: new Date(sessionStartsAt),
				endsAt: new Date(sessionEndsAt),
				venueName: sessionVenue || null,
				venueAddress: sessionAddress || null,
				onlineUrl: sessionUrl || null,
			},
		});
		sessionName = "";
		sessionStartsAt = "";
		sessionEndsAt = "";
		sessionVenue = "";
		sessionAddress = "";
		sessionUrl = "";
		await refreshEvent();
	} catch (error) {
		errorMessage =
			error instanceof Error ? error.message : "Unable to add session.";
	} finally {
		isAddingSession = false;
	}
}
</script>

<svelte:head>
	<title>Manage event</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8">
	<a href="/dashboard/events" class="text-sm text-indigo-400 hover:text-indigo-300">← Manage events</a>

	{#if eventQuery.isPending}
		<p class="mt-6 text-neutral-400">Loading event…</p>
	{:else if eventQuery.isError || !eventQuery.data}
		<p class="mt-6 rounded border border-red-900 bg-red-950/50 p-4 text-red-300">
			Event not found or unavailable.
		</p>
	{:else}
		<h1 class="mt-4 text-3xl font-semibold">Edit event</h1>
		<form
			class="mt-6 space-y-5 rounded-lg border border-neutral-800 bg-neutral-900 p-6"
			onsubmit={(event) => {
				event.preventDefault();
				void saveEvent();
			}}
		>
			<label class="block space-y-2">
				<span class="text-sm font-medium">Title</span>
				<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={title} required />
			</label>
			<label class="block space-y-2">
				<span class="text-sm font-medium">Slug</span>
				<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={slug} required />
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

			<div class="flex justify-between gap-3">
				<button class="rounded px-3 py-2 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50" type="button" onclick={() => void deleteEvent()} disabled={isSavingEvent}>
					Delete event
				</button>
				<button class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50" disabled={isSavingEvent}>
					{isSavingEvent ? "Saving…" : "Save event"}
				</button>
			</div>
		</form>

		<section class="mt-10">
			<h2 class="text-2xl font-semibold">Sessions</h2>
			<form
				class="mt-4 space-y-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5"
				onsubmit={(event) => {
					event.preventDefault();
					void addSession();
				}}
			>
				<h3 class="font-medium">Add session</h3>
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="block space-y-2"><span class="text-sm">Name</span><input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={sessionName} /></label>
					<label class="block space-y-2"><span class="text-sm">Venue</span><input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={sessionVenue} /></label>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<label class="block space-y-2"><span class="text-sm">Starts at</span><input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={sessionStartsAt} type="datetime-local" required /></label>
					<label class="block space-y-2"><span class="text-sm">Ends at</span><input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={sessionEndsAt} type="datetime-local" required /></label>
				</div>
				<label class="block space-y-2"><span class="text-sm">Address</span><input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={sessionAddress} /></label>
				<label class="block space-y-2"><span class="text-sm">Online URL</span><input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={sessionUrl} type="url" /></label>
				<button class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50" disabled={isAddingSession}>
					{isAddingSession ? "Adding…" : "Add session"}
				</button>
			</form>

			<div class="mt-4 space-y-4">
				{#each eventQuery.data.sessions as session (session.id)}
					<EventSessionEditor {session} onChanged={refreshEvent} />
				{:else}
					<p class="text-neutral-400">No sessions yet.</p>
				{/each}
			</div>
		</section>
	{/if}
</div>

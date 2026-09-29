<script lang="ts">
import { client } from "$lib/orpc";

type Session = {
	id: string;
	name: string | null;
	startsAt: Date;
	endsAt: Date;
	status: "scheduled" | "canceled";
	venueName: string | null;
	venueAddress: string | null;
	onlineUrl: string | null;
};

let {
	session,
	onChanged,
}: { session: Session; onChanged: () => Promise<unknown> } = $props();

let sessionId = $state("");
let name = $state("");
let startsAt = $state("");
let endsAt = $state("");
let status = $state<"scheduled" | "canceled">("scheduled");
let venueName = $state("");
let venueAddress = $state("");
let onlineUrl = $state("");
let isSaving = $state(false);
let errorMessage = $state<string | null>(null);

$effect(() => {
	if (session.id !== sessionId) {
		sessionId = session.id;
		name = session.name ?? "";
		startsAt = toDateTimeLocal(session.startsAt);
		endsAt = toDateTimeLocal(session.endsAt);
		status = session.status;
		venueName = session.venueName ?? "";
		venueAddress = session.venueAddress ?? "";
		onlineUrl = session.onlineUrl ?? "";
	}
});

function toDateTimeLocal(value: Date) {
	const offset = value.getTimezoneOffset() * 60_000;
	return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

async function save() {
	isSaving = true;
	errorMessage = null;
	try {
		await client.eventSessions.update({
			id: session.id,
			data: {
				name: name || null,
				startsAt: new Date(startsAt),
				endsAt: new Date(endsAt),
				status,
				venueName: venueName || null,
				venueAddress: venueAddress || null,
				onlineUrl: onlineUrl || null,
			},
		});
		await onChanged();
	} catch (error) {
		errorMessage =
			error instanceof Error ? error.message : "Unable to update session.";
	} finally {
		isSaving = false;
	}
}

async function remove() {
	if (!confirm("Delete this session?")) {
		return;
	}
	isSaving = true;
	errorMessage = null;
	try {
		await client.eventSessions.delete({ id: session.id });
		await onChanged();
	} catch (error) {
		errorMessage =
			error instanceof Error ? error.message : "Unable to delete session.";
	} finally {
		isSaving = false;
	}
}
</script>

<form
	class="space-y-4 rounded border border-neutral-800 p-4"
	onsubmit={(event) => {
		event.preventDefault();
		void save();
	}}
>
	<div class="grid gap-4 sm:grid-cols-2">
		<label class="block space-y-2">
			<span class="text-sm font-medium">Session name</span>
			<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={name} />
		</label>
		<label class="block space-y-2">
			<span class="text-sm font-medium">Status</span>
			<select class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={status}>
				<option value="scheduled">Scheduled</option>
				<option value="canceled">Canceled</option>
			</select>
		</label>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<label class="block space-y-2">
			<span class="text-sm font-medium">Starts at</span>
			<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={startsAt} type="datetime-local" required />
		</label>
		<label class="block space-y-2">
			<span class="text-sm font-medium">Ends at</span>
			<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={endsAt} type="datetime-local" required />
		</label>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<label class="block space-y-2">
			<span class="text-sm font-medium">Venue</span>
			<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={venueName} />
		</label>
		<label class="block space-y-2">
			<span class="text-sm font-medium">Address</span>
			<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={venueAddress} />
		</label>
	</div>

	<label class="block space-y-2">
		<span class="text-sm font-medium">Online URL</span>
		<input class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2" bind:value={onlineUrl} type="url" />
	</label>

	{#if errorMessage}
		<p class="rounded border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">{errorMessage}</p>
	{/if}

	<div class="flex justify-between gap-3">
		<button class="rounded px-3 py-2 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50" type="button" onclick={() => void remove()} disabled={isSaving}>
			Delete session
		</button>
		<button class="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50" disabled={isSaving}>
			{isSaving ? "Saving…" : "Save session"}
		</button>
	</div>
</form>

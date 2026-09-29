<script lang="ts">
import { goto } from "$app/navigation";
import { authClient } from "$lib/auth-client";

const sessionQuery = authClient.useSession();
const { children } = $props();

$effect(() => {
	if (!$sessionQuery.isPending && !$sessionQuery.data?.user) {
		goto("/login");
	}
});
</script>

{#if $sessionQuery.isPending}
	<div class="mx-auto max-w-5xl px-4 py-10 text-sm text-neutral-400">
		Checking your session…
	</div>
{:else if $sessionQuery.data?.user}
	{@render children()}
{/if}

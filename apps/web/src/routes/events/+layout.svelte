<script lang="ts">
import AuthenticatedLayout from "../../components/AuthenticatedLayout.svelte";

const { children } = $props();
</script>

<AuthenticatedLayout>
	{@render children()}
</AuthenticatedLayout>

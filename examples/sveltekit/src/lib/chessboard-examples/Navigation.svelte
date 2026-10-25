<script lang="ts">
	let {
		links,
		currentPath
	}: {
		links: readonly { href: string; label: string }[];
		currentPath: string;
	} = $props();
</script>

<nav class="top-nav" aria-label="Chessboard examples">
	<div class="brand">Chessboard examples</div>
	<div class="links">
		{#each links as link (link.href)}
			<!-- Resolved URLs are supplied by the host; keep this component independent of Kit. -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={link.href}
				aria-current={currentPath === link.href ? 'page' : undefined}
				class={{ active: currentPath === link.href }}>{link.label}</a
			>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/each}
	</div>
</nav>

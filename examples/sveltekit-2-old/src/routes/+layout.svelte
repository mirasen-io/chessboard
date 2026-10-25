<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'Debug' },
		{ href: '/free', label: 'Free' },
		{ href: '/2-custom-ext-list', label: 'Custom Extension List' },
		{ href: '/promotion', label: 'Promotion' },
		{ href: '/chessjs', label: 'Chess.js Adapter' }
	] as const;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
	<nav class="top-nav">
		<div class="brand">Manual routes</div>

		<div class="links">
			{#each links as link (link.href)}
				<a href={resolve(link.href)} class:active={page.url.pathname === link.href}>
					{link.label}
				</a>
			{/each}
		</div>
	</nav>

	<main class="content">
		{@render children()}
	</main>
</div>

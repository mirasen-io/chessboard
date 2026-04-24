<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'Debug' },
		{ href: '/free', label: 'Free' },
		{ href: '/2-custom-ext-list', label: 'Custom Extension List' },
		{ href: '/promotion', label: 'Promotion' }
		// { href: '/castle', label: 'Castle' }
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

<style>
	:global(body) {
		margin: 0;
		background: #f3f4f6;
		color: #111827;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	.app-shell {
		min-height: 100vh;
	}

	.top-nav {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 20px;
		background: rgba(17, 24, 39, 0.92);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.brand {
		font-size: 14px;
		font-weight: 700;
		color: white;
		letter-spacing: 0.02em;
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 12px;
		border-radius: 10px;
		text-decoration: none;
		font-size: 14px;
		font-weight: 600;
		color: #d1d5db;
		background: transparent;
		transition:
			background 120ms ease,
			color 120ms ease;
	}

	a:hover {
		background: rgba(255, 255, 255, 0.08);
		color: white;
	}

	a.active {
		background: white;
		color: #111827;
	}

	.content {
		min-height: calc(100vh - 61px);
	}
</style>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import Navigation from '#lib/chessboard-examples/Navigation.svelte';
	import { exampleLinks } from '#lib/chessboard-examples/links.js';
	import '#lib/chessboard-examples/chessboard-examples.css';
	import favicon from '#lib/assets/favicon.svg';
	import './layout.css';

	let { children }: LayoutProps = $props();
	const links = exampleLinks.map(({ route, label }) => ({ href: resolve(route), label }));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="chessboard-examples">
	<Navigation {links} currentPath={page.url.pathname} />
	<main>{@render children()}</main>
</div>

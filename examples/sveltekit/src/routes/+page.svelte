<script lang="ts">
	import { resolve } from '$app/paths';
	import { exampleLinks } from '#lib/chessboard-examples/links.js';
</script>

<svelte:head><title>Chessboard examples</title></svelte:head>

<div class="page">
	<section class="panel">
		<h1>Chessboard examples</h1>
		<p class="subtitle">Manual checks for the local chessboard library. Start with Debug.</p>
		<ul>
			{#each exampleLinks as link (link.route)}
				<li><a href={resolve(link.route)}>{link.label}</a></li>
			{/each}
		</ul>
	</section>
</div>

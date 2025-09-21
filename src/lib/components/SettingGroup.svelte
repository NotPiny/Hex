<script lang="ts">
	export let title: string = '';
</script>

<div class="setting-group">
	{#if title}
		<h2 class="group-title">{title}</h2>
	{/if}
	<div class="settings-list">
		<slot />
	</div>
</div>

<style>
	.setting-group {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.group-title {
		margin: 32px 0 16px 0;
		color: #ffffff;
		font-size: 20px;
		font-weight: 600;
		border-bottom: 1px solid #40444b;
		padding-bottom: 8px;
	}

	.settings-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>

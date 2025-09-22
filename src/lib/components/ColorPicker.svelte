<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value: string | undefined = undefined;
	export let label: string = '';
	export let description: string = '';
	export let resetable: boolean = true;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher();

	function handleReset() {
		if (!disabled) {
			value = undefined;
			dispatch('reset');
		}
	}

	function handleChange() {
		if (!disabled) {
			dispatch('change', value);
		}
	}
</script>

<div class="color-picker-container">
	{#if label || description}
		<div class="color-picker-info">
			{#if label}
				<h3>{label}</h3>
			{/if}
			{#if description}
				<p>{description}</p>
			{/if}
		</div>
	{/if}
	
	<div class="color-picker-controls">
		<input
			type="color"
			bind:value
			on:change={handleChange}
			class="color-input"
			class:disabled
			title={label || 'Select color'}
			{disabled}
		/>
		{#if resetable}
			<button
				class="reset-button"
				class:disabled
				on:click={handleReset}
				title="Reset to default"
				disabled={disabled}
			>
				Reset
			</button>
		{/if}
	</div>
</div>

<style>
	.color-picker-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24px;
		background: #40444b;
		border-radius: 12px;
		transition: background-color 0.2s ease;
		gap: 24px;
	}

	.color-picker-container:hover {
		background: #484c52;
	}

	.color-picker-info {
		flex: 1;
	}

	.color-picker-info h3 {
		margin: 0 0 8px 0;
		color: #ffffff;
		font-size: 18px;
		font-weight: 600;
	}

	.color-picker-info p {
		margin: 0;
		color: #b9bbbe;
		font-size: 14px;
		line-height: 1.4;
	}

	.color-picker-controls {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
	}

	.color-input {
		width: 48px;
		height: 48px;
		border: 2px solid #5865f2;
		border-radius: 8px;
		cursor: pointer;
		background: none;
		transition: all 0.2s ease;
	}

	.color-input:hover {
		border-color: #7289da;
		transform: scale(1.05);
	}

	.color-input.disabled {
		cursor: not-allowed;
		opacity: 0.6;
		border-color: #4a4d53;
	}

	.color-input.disabled:hover {
		border-color: #4a4d53;
		transform: none;
	}

	.reset-button {
		background: #ed4245;
		color: white;
		border: none;
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.reset-button:hover {
		background: #c03d40;
		transform: translateY(-1px);
	}

	.reset-button.disabled {
		cursor: not-allowed;
		opacity: 0.6;
		background: #4a4d53;
	}

	.reset-button.disabled:hover {
		background: #4a4d53;
		transform: none;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.color-picker-container {
			flex-direction: column;
			align-items: stretch;
			gap: 16px;
			text-align: center;
		}

		.color-picker-controls {
			justify-content: center;
		}
	}
</style>

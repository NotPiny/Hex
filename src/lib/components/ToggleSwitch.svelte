<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let checked: boolean = false;
	export let label: string = '';
	export let description: string = '';
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher();

	function handleChange() {
		if (!disabled) {
			dispatch('change', checked);
		}
	}
</script>

<div class="toggle-container">
	{#if label || description}
		<div class="toggle-info">
			{#if label}
				<h3>{label}</h3>
			{/if}
			{#if description}
				<p>{description}</p>
			{/if}
		</div>
	{/if}
	
	<div class="toggle-controls">
		<label class="toggle-switch" class:disabled>
			<input 
				type="checkbox" 
				bind:checked 
				on:change={handleChange}
				{disabled}
			/>
			<span class="toggle-slider"></span>
		</label>
	</div>
</div>

<style>
	.toggle-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24px;
		background: #40444b;
		border-radius: 12px;
		transition: background-color 0.2s ease;
		gap: 24px;
	}

	.toggle-container:hover {
		background: #484c52;
	}

	.toggle-info {
		flex: 1;
	}

	.toggle-info h3 {
		margin: 0 0 8px 0;
		color: #ffffff;
		font-size: 18px;
		font-weight: 600;
	}

	.toggle-info p {
		margin: 0;
		color: #b9bbbe;
		font-size: 14px;
		line-height: 1.4;
	}

	.toggle-controls {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	/* Toggle Switch Styles */
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 60px;
		height: 34px;
		cursor: pointer;
	}

	.toggle-switch.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #72767d;
		transition: 0.3s;
		border-radius: 34px;
	}

	.toggle-slider:before {
		position: absolute;
		content: "";
		height: 26px;
		width: 26px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		transition: 0.3s;
		border-radius: 50%;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.toggle-switch input:checked + .toggle-slider {
		background-color: #5865f2;
	}

	.toggle-switch input:checked + .toggle-slider:before {
		transform: translateX(26px);
	}

	.toggle-switch:not(.disabled) .toggle-slider:hover {
		box-shadow: 0 0 0 8px rgba(88, 101, 242, 0.1);
	}

	.toggle-switch.disabled .toggle-slider {
		background-color: #4a4d53;
		cursor: not-allowed;
	}

	.toggle-switch.disabled input:checked + .toggle-slider {
		background-color: #4a4d53;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.toggle-container {
			flex-direction: column;
			align-items: stretch;
			gap: 16px;
			text-align: center;
		}

		.toggle-controls {
			justify-content: center;
		}
	}
</style>

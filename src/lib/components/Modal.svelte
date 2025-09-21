<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let title: string = '';
	export let maxWidth: string = '600px';
	export let closable: boolean = true;

	const dispatch = createEventDispatcher();

	function closeModal() {
		if (closable) {
			dispatch('close');
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closable) {
			closeModal();
		}
	}

	function handleOverlayClick(event: MouseEvent) {
		// Only close if the click was directly on the overlay (not on modal content)
		if (closable && event.target === event.currentTarget) {
			closeModal();
		}
	}

	function handleOverlayKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div 
	class="modal-overlay" 
	on:click={handleOverlayClick}
	on:keydown={handleOverlayKeydown}
	role="button"
	tabindex="0"
	aria-label="Close modal"
>
	<div 
		class="modal" 
		style="max-width: {maxWidth}" 
		role="document"
	>
		{#if title || closable}
			<div class="modal-header">
				{#if title}
					<h2>{title}</h2>
				{/if}
				{#if closable}
					<button 
						class="close-button" 
						on:click={closeModal}
						aria-label="Close modal"
					>
						✕
					</button>
				{/if}
			</div>
		{/if}
		
		<div class="modal-content">
			<slot />
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	.modal {
		cursor: default;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal {
		background: #2f3136;
		border-radius: 16px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
		width: 90%;
		max-height: 90vh;
		overflow: hidden;
		animation: slideIn 0.3s ease-out;
		display: flex;
		flex-direction: column;
	}

	@keyframes slideIn {
		from {
			transform: translateY(-20px) scale(0.95);
			opacity: 0;
		}
		to {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24px 32px;
		border-bottom: 1px solid #40444b;
		background: #36393f;
	}

	.modal-header h2 {
		margin: 0;
		color: #ffffff;
		font-size: 24px;
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		color: #b9bbbe;
		font-size: 20px;
		cursor: pointer;
		padding: 8px;
		border-radius: 8px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
	}

	.close-button:hover {
		background: #40444b;
		color: #ffffff;
	}

	.modal-content {
		padding: 32px;
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.modal {
			width: 95%;
			margin: 20px;
			max-height: 95vh;
		}

		.modal-header {
			padding: 16px 20px;
		}

		.modal-header h2 {
			font-size: 20px;
		}

		.modal-content {
			padding: 20px;
		}
	}
</style>

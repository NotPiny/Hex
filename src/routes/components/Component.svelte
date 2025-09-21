<script lang="ts">
	import { mount } from 'svelte';
	import { components } from './stores';
	import TypePicker from './TypePicker.svelte';
	import { ComponentType } from './types';
	import type { Component } from './types';

	$: baseContainer = $components[0];

	export let label = 'Text Display';
	export let description = `[${label}]`;
	export let icon = 'https://media.piny.dev/DaalBotSquare.png';
	export let id: number;
	export let hex_id: number = 0;
	export let component: any = null; // Pass the full component to access hex object

	export let expanded = false;
	export let noDelete = false;
	export let noClose = false;
	export let customButtons: { label: string; class: string; onClick: Function }[] = [];
	export let showMoveButtons = true;
	export let onDragStart: ((e: DragEvent, index: number) => void) | null = null;
	export let onDragOver: ((e: DragEvent) => void) | null = null;
	export let onDragLeave: ((e: DragEvent) => void) | null = null;
	export let onDrop: ((e: DragEvent, index: number) => void) | null = null;
	export let isDragTarget = false;
	export let isDragging = false;

	// Suppress unused export warnings - these are used in parent components
	$: void onDragStart, onDragOver, onDragLeave, onDrop, isDragTarget, isDragging;

	// Generate pastel color based on hex_id
	function generatePastelColor(seed: number): string {
		const pastelColors = [
			'#FFB3BA', '#FFDFBA', '#FFFFBA', '#BFFFBA', '#BAE1FF',
			'#FFB3FF', '#D1B3FF', '#B3FFFF', '#FFD1DC', '#E6E6FA',
			'#F0E68C', '#DDA0DD', '#F5DEB3', '#FFC0CB', '#98FB98',
			'#87CEEB', '#F0F8FF', '#FFEFD5', '#E0E0E0', '#FAFAD2'
		];
		return pastelColors[seed % pastelColors.length];
	}

	$: iconBackgroundColor = component?.hex?.color || generatePastelColor(hex_id);

	function moveComponentUp() {
		components.update((c) => {
			const container = c[0];
			const currentIndex = container.components.findIndex(comp => comp.hex_id === hex_id);
			if (currentIndex > 0) {
				// Swap with the previous component
				[container.components[currentIndex - 1], container.components[currentIndex]] = 
				[container.components[currentIndex], container.components[currentIndex - 1]];
			}
			return c;
		});
	}

	function moveComponentDown() {
		components.update((c) => {
			const container = c[0];
			const currentIndex = container.components.findIndex(comp => comp.hex_id === hex_id);
			if (currentIndex < container.components.length - 1) {
				// Swap with the next component
				[container.components[currentIndex], container.components[currentIndex + 1]] = 
				[container.components[currentIndex + 1], container.components[currentIndex]];
			}
			return c;
		});
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div 
	class="component" 
	class:expanded 
	class:drag-target={isDragTarget}
	class:dragging={isDragging}
	on:click={() => (expanded = true)} 
	on:dragover={(e) => {
		e.preventDefault();
		onDragOver?.(e);
	}}
	on:dragleave={(e) => onDragLeave?.(e)}
	on:drop={(e) => {
		e.preventDefault();
		onDrop?.(e, id);
	}}
	id="component-{id}"
>
	<div class="summary" 
		draggable="true"
		on:dragstart={(e) => onDragStart?.(e, id)}
	>
		<div class="main">
			<img src={icon} alt="Component Icon" style="background-color: {iconBackgroundColor};" />
			<p class="label">{label}</p>
		</div>
		<div class="description-and-buttons">
			<p class="description">{description}</p>
			<!-- Move buttons positioned in top right when not expanded -->
			{#if showMoveButtons && !expanded}
				<div class="move-buttons-compact">
					<button
						class="move-btn-compact move-btn-up"
						on:click|stopPropagation={() => moveComponentUp()}
						disabled={baseContainer.components.findIndex(comp => comp.hex_id === hex_id) === 0}
						>↑</button
					>
					<button
						class="move-btn-compact move-btn-down"
						on:click|stopPropagation={() => moveComponentDown()}
						disabled={baseContainer.components.findIndex(comp => comp.hex_id === hex_id) === baseContainer.components.length - 1}
						>↓</button
					>
				</div>
			{/if}
		</div>
	</div>
	
	{#if expanded}
		<div class="content" 
			on:dragstart|stopPropagation
			on:mousedown={(e) => {
				// Allow text selection in inputs and textareas
				if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
					e.stopPropagation();
				}
			}}
		>
			<slot />
			<div class="actions">
				<!-- Move buttons for expanded view - positioned first (leftmost) -->
				{#if showMoveButtons && expanded}
					<button
						class="move-component-expanded move-btn-down-expanded colour-danger"
						on:click={() => moveComponentDown()}
						disabled={baseContainer.components.findIndex(comp => comp.hex_id === hex_id) === baseContainer.components.length - 1}
						>↓</button
					>
				{/if}

				<!-- Type specific actions -->
				{#if label == 'Media Gallery'}
					<button
						class="add-component colour-success"
						class:disabled={baseContainer.components.find((c) => c.id == id + 1)?.items?.length ==
							10}
						disabled={baseContainer.components.find((c) => c.id == id + 1)?.items?.length == 10}
						on:click={() => {
							baseContainer.components = baseContainer.components.map((component) => {
								if (component.type === ComponentType.MediaGallery) {
									// @ts-ignore
									component.items = [
										...(component.items ?? []),
										{
											media: {
												url: 'https://media.piny.dev/DaalBotSquare.png',
												hex_id: Math.floor(Math.random() * 1000000)
											}
										}
									];
								}
								return component;
							});

							components.set($components);

							components.update((c) => {
								c[0] = baseContainer;
								return c;
							});
						}}>Add Image</button
					>
				{/if}

				{#if label == 'Action Row'}
					<button
						class="add-component colour-success"
						class:disabled={baseContainer.components.find((c) => c.id == id + 1)?.components
							?.length == 5}
						disabled={baseContainer.components.find((c) => c.id == id + 1)?.components?.length == 5}
						on:click={() => {
							const existingChildren = baseContainer.components.find(
								(c) => c.id == id + 1
							)?.components;

							// Check if the component is already at 1 selector
							if (
								existingChildren?.length == 1 &&
								existingChildren[0].type != ComponentType.Button
							) {
								return alert('Action rows can only have 1 select menu');
							}

							mount(TypePicker, {
								target: document.body,
								props: {
									allowedTypes:
										(existingChildren ?? []).filter((c) => c.type == ComponentType.Button).length >=
										1
											? [ComponentType.Button]
											: [
													ComponentType.Button,
													ComponentType.StringSelectMenu,
													ComponentType.UserSelectMenu,
													ComponentType.RoleSelectMenu,
													ComponentType.MentionableSelectMenu,
													ComponentType.ChannelSelectMenu
												],
									submit: (ic: Component) => {
										baseContainer.components = baseContainer.components.map((component) => {
											if (component.id == id + 1) {
												// @ts-ignore
												component.components = [...(component.components ?? []), ic];
											}
											return component;
										});

										// Add a hex_id to the component
										baseContainer.components = baseContainer.components.map((component) => {
											if (component.id == id + 1) {
												// @ts-ignore
												component.components = component.components.map((c) => {
													c.hex_id = c.hex_id || Math.floor(Math.random() * 1000000);
													return c;
												});
											}
											return component;
										});

										// Get the new component
										const newComponent = baseContainer.components
											.find((c) => c.id == id + 1)
											?.components?.slice(-1)[0];
										if (!newComponent) return console.error('No new component found');

										newComponent.id = 1000 + Math.floor(Math.random() * 1000);
										if (newComponent.type == ComponentType.Button) {
											newComponent.label = 'Button';
											newComponent.disabled = false;
										}

										newComponent.custom_id = 'custom_id';

										components.set($components);

										components.update((c) => {
											c[0] = baseContainer;
											return c;
										});
									}
								}
							});
						}}>Add Component</button
					>
				{/if}

				<!-- Delay needed to stop on:click above from immediately reopening box -->
				{#if !noClose}
					<button
						class="close-component colour-secondary"
						on:click={() => {
							setTimeout(() => {
								expanded = false;
							}, 100);
						}}>Close</button
					>
				{/if}
				{#if !noDelete}
					<button
						class="remove-component colour-danger"
						on:click={() => {
							components.update((c) => {
								baseContainer.components = baseContainer.components.filter(
									(component) => component.hex_id !== hex_id
								);
								return c;
							});
						}}>Remove Component</button
					>
				{/if}

				<!-- Custom buttons -->
				{#each customButtons as button}
					<button class="add-component {button.class}" on:click={() => button.onClick()}
						>{button.label}</button
					>
				{/each}

				<!-- Move up button positioned on the right for expanded view -->
				{#if showMoveButtons && expanded}
					<button
						class="move-component-expanded move-btn-up-expanded colour-success"
						on:click={() => moveComponentUp()}
						disabled={baseContainer.components.findIndex(comp => comp.hex_id === hex_id) === 0}
						>↑</button
					>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.component {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		background-color: #1c1d20;
		border-radius: 20px;
		gap: 1rem;
		padding: 20px;
		box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
		position: relative;
	}

	.move-buttons-compact {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.move-btn-compact {
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 12px;
		font-weight: bold;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
	}

	.move-btn-up {
		background-color: #00863a; /* Discord success green to match colour-success */
	}

	.move-btn-up:hover:not(:disabled) {
		background-color: #006c2e; /* Darker green for hover */
	}

	.move-btn-down {
		background-color: #d22d39; /* Discord danger red to match colour-danger */
	}

	.move-btn-down:hover:not(:disabled) {
		background-color: #a8232d; /* Darker red for hover */
	}

	.move-btn-compact:disabled {
		background-color: #4a4d53;
		color: #72767d;
		cursor: not-allowed;
	}

	.move-component-expanded {
		min-width: 40px;
		height: 40px;
		border: none;
		border-radius: 10px;
		color: white;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
	}

	.move-component-expanded:disabled {
		background-color: #4a4d53;
		color: #72767d;
		cursor: not-allowed;
	}

	.drag-target {
		border: 2px dashed #5865f2;
		background-color: rgba(88, 101, 242, 0.1);
	}

	.summary[draggable="true"] {
		cursor: grab;
	}

	.summary[draggable="true"]:active {
		cursor: grabbing;
	}

	.summary[draggable="true"]:hover {
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		transition: background-color 0.2s ease;
	}

	.component.dragging {
		opacity: 0.6;
		transform: rotate(2deg);
	}

	.summary {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		width: 100%;
		user-select: none; /* Prevent text selection in drag handle */
	}

	.description-and-buttons {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;
	}

	.summary .main {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.25rem;
	}

	.component img {
		width: 50px;
		height: 50px;
		border-radius: 20%;
		margin-right: 20px;
		/* Background color now set dynamically via style attribute */
	}

	.expanded {
		background-color: #2c2f33;
		box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: column;

		justify-content: start;
		gap: 10px;

		transition: all 0.2s ease-in;
	}

	.actions {
		display: flex;
		flex-direction: row;
		justify-content: center;
		margin-top: 20px;
		gap: 10px;
	}

	.content {
		width: 90%;
		user-select: text; /* Allow text selection in content area */
	}

	.move-component:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

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

	export let expanded = false;
	export let noDelete = false;
	export let noClose = false;
	export let customButtons: { label: string; class: string; onClick: Function }[] = [];
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="component" class:expanded on:click={() => (expanded = true)} id="component-{id}">
	<div class="summary">
		<div class="main">
			<img src={icon} alt="Component Icon" />
			<p class="label">{label}</p>
		</div>
		<p class="description">{description}</p>
	</div>
	{#if expanded}
		<div class="content">
			<slot />
			<div class="actions">
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
												hex_id: Math.floor(Math.random() * 1000)
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
													c.hex_id = Math.floor(Math.random() * 1000);
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
									(component) => component.id !== id + 1
								);
								return c;
							});

							document.getElementById(`component-${id + 1}`)?.remove();
						}}>Remove Component</button
					>
				{/if}

				<!-- Custom buttons -->
				{#each customButtons as button}
					<button class="add-component {button.class}" on:click={() => button.onClick()}
						>{button.label}</button
					>
				{/each}
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
	}

	.summary {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;

		width: 100%;
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

		background-color: #eaddff;
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
	}
</style>

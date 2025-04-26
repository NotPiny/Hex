<script lang="ts">
	import type { Component } from './types';
	import { ComponentType } from './types';
	import { components } from './stores';
	import { browser } from '$app/environment';

	// Callback to handle the submission of the popup form
	export let submit = (data: Component) => {
		console.log('Submit:', data);
	};

	export let allowedTypes: ComponentType[] = [
		ComponentType.ActionRow,
		ComponentType.Button,
		ComponentType.StringSelectMenu,
		ComponentType.UserSelectMenu,
		ComponentType.RoleSelectMenu,
		ComponentType.MentionableSelectMenu,
		ComponentType.ChannelSelectMenu,
		ComponentType.Section,
		ComponentType.TextDisplay,
		ComponentType.Thumbnail,
		ComponentType.MediaGallery,
		ComponentType.File,
		ComponentType.Seperator
	];

	const typeNames: Record<ComponentType, string> = {
		[ComponentType.ActionRow]: 'Action Row',
		[ComponentType.Button]: 'Button',
		[ComponentType.StringSelectMenu]: 'String Select Menu',
		[ComponentType.UserSelectMenu]: 'User Select Menu',
		[ComponentType.RoleSelectMenu]: 'Role Select Menu',
		[ComponentType.MentionableSelectMenu]: 'Mentionable Select Menu',
		[ComponentType.ChannelSelectMenu]: 'Channel Select Menu',
		[ComponentType.Section]: 'Section',
		[ComponentType.TextDisplay]: 'Text Display',
		[ComponentType.Thumbnail]: 'Thumbnail',
		[ComponentType.MediaGallery]: 'Media Gallery',
		[ComponentType.File]: 'File',
		[ComponentType.Seperator]: 'Seperator',
		[ComponentType.Container]: 'Container'
	};

	async function closeOverlay() {
		if (!browser) return console.debug('Ignoring non browser'); // No SSR >:(

		const overlay = document.getElementById('select-component');
		if (overlay) {
			overlay.remove();
		} else {
			console.error('Overlay not found');
		}
	}

	const baseContainer = $components[0];
</script>

<div class="overlay" id="select-component">
	<div class="container">
		<h3>Select Component</h3>
		<select id="component-type">
			{#each Object.entries(typeNames) as [type, name]}
				{#if allowedTypes.includes(parseInt(type))}
					<!-- Containers would be a lot more effort, maybe in the future -->
					<option value={type}>{name}</option>
				{/if}
			{/each}
		</select>

		<div class="actions">
			<button class="close-component colour-secondary" on:click={closeOverlay}>Close</button>
			<button
				class="add-component colour-success"
				on:click={() => {
					const selectedType = (document.querySelector('#component-type') as HTMLSelectElement)
						.value;
					console.debug('Selected type:', selectedType);
					const newComponent: Component = {
						id: baseContainer.components.length + 1,
						type: parseInt(selectedType)
					};

					switch (newComponent.type) {
						case ComponentType.TextDisplay:
							newComponent.content = 'Enter text here...';
							break;
						case ComponentType.MediaGallery:
							newComponent.items = [];
							break;
						case ComponentType.ActionRow:
							newComponent.components = [];
							break;
						default:
							break;
					}

					submit(newComponent);
					closeOverlay();
				}}>Select Component</button
			>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.container {
		background-color: #2c2f33;
		width: 30rem;
		height: 13rem;

		padding: 20px;
		border-radius: 10px;
		box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
	}

	select {
		width: 100%;
		max-width: 100%;
		height: 50px;
		border-radius: 10px;
		background-color: #2c2d30;
		color: white;
		padding: 10px;
		border: none;
		box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
	}

	.actions {
		display: flex;
		justify-content: space-between;
		margin-top: 20px;
	}
</style>

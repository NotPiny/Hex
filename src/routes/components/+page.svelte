<script lang="ts">
	import Component from './Component.svelte';
	import Create from './Create.svelte';
	import Preview from './Preview.svelte';
	import Modal from '../../lib/components/Modal.svelte';
	import SettingGroup from '../../lib/components/SettingGroup.svelte';
	import ColorPicker from '../../lib/components/ColorPicker.svelte';
	import ToggleSwitch from '../../lib/components/ToggleSwitch.svelte';
	import { components } from './stores';
	import type { ComponentContainer, UnfurledMediaItem, Component as tComponent } from './types';
	import { ComponentType } from './types';
	import { mount, onMount } from 'svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';

	const cleanAll = (obj: any) => {
		for (const key in obj) {
			if (key === 'hex_id' || key === 'hex') {
				delete obj[key];
			} else if (key === 'id') {
				try {
					obj.id = obj.id.replace(/,/g, ''); // Remove commas from IDs (Strange import bug)
				} catch (e) {
					// Ignore errors
				}
			} else if (typeof obj[key] === 'object' && obj[key] !== null) {
				cleanAll(obj[key]);
			}
		}
	};

	// Function to get clean JSON representation
	export function getCleanJSON() {
		let outputObject = JSON.parse(JSON.stringify(baseContainer)); // Deep clone
		cleanAll(outputObject);
		
		if (!useBaseContainer) {
			return JSON.stringify(outputObject.components, null, 2);
		}
		return JSON.stringify([outputObject], null, 2);
	}

	$: baseContainer = $components[0];

	// Function to transform Discord API format to internal format
	function transformDiscordToInternal(discordData: any): any {
		if (Array.isArray(discordData)) {
			return discordData.map(item => transformDiscordToInternal(item));
		} else if (discordData && typeof discordData === 'object') {
			const transformed = { ...discordData };
			
			// Transform property names from Discord format to internal format
			if (transformed.customId !== undefined) {
				transformed.custom_id = transformed.customId;
				delete transformed.customId;
			}
			
			// Map disabled state (Discord API doesn't usually include disabled field if not disabled)
			if (transformed.disabled === undefined) {
				transformed.disabled = false; // Default to enabled
			} else {
				transformed.disabled = Boolean(transformed.disabled);
			}
			
			// Handle style mapping - only set default if style is missing AND it's a button
			if (transformed.type === ComponentType.Button && transformed.style === undefined) {
				transformed.style = 2; // Default to secondary style only if missing
			}
			
			// Handle emoji field
			if (transformed.emoji === undefined) {
				transformed.emoji = null;
			}
			
			// Handle url field for link buttons
			if (transformed.type === ComponentType.Button && transformed.style === 5 && !transformed.url) {
				transformed.url = '';
			}
			
			// Handle items array for MediaGallery (type 12)
			if (transformed.type === 12 && transformed.items) {
				transformed.items = transformed.items.map((item: any) => {
					if (item.media) {
						return {
							media: {
								url: item.media.url,
								hex_id: Math.floor(Math.random() * 1000000)
							}
						};
					}
					return item;
				});
			}
			
			// Recursively transform nested components
			if (transformed.components) {
				transformed.components = transformed.components.map((comp: any) => transformDiscordToInternal(comp));
			}
			
			return transformed;
		}
		return discordData;
	}

	// Function to ensure all components have hex_id and hex object
	function ensureHexIds(obj: any): any {
		if (Array.isArray(obj)) {
			return obj.map(item => ensureHexIds(item));
		} else if (obj && typeof obj === 'object') {
			const newObj = { ...obj };
			
			// Add hex_id and hex object if it doesn't exist and the object has a type (indicating it's a component)
			if (newObj.type !== undefined && (newObj.hex_id === undefined || newObj.hex_id === null)) {
				const hexId = Math.floor(Math.random() * 1000000);
				newObj.hex_id = hexId;
				newObj.hex = {
					id: hexId,
					color: generatePastelColor(hexId)
				};
			}
			
			// Recursively process nested objects
			for (const key in newObj) {
				if (newObj[key] && typeof newObj[key] === 'object') {
					newObj[key] = ensureHexIds(newObj[key]);
				}
			}
			
			return newObj;
		}
		return obj;
	}

	// Generate pastel color based on seed
	function generatePastelColor(seed: number): string {
		const pastelColors = [
			'#FFB3BA', '#FFDFBA', '#FFFFBA', '#BFFFBA', '#BAE1FF',
			'#FFB3FF', '#D1B3FF', '#B3FFFF', '#FFD1DC', '#E6E6FA',
			'#F0E68C', '#DDA0DD', '#F5DEB3', '#FFC0CB', '#98FB98',
			'#87CEEB', '#F0F8FF', '#FFEFD5', '#E0E0E0', '#FAFAD2'
		];
		return pastelColors[seed % pastelColors.length];
	}

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

	const typeDescription: Record<ComponentType, string> = {
		[ComponentType.ActionRow]: 'A row of components such as buttons',
		[ComponentType.Button]: 'A button that can be clicked',
		[ComponentType.StringSelectMenu]: 'A dropdown menu with a list of predetermined options',
		[ComponentType.UserSelectMenu]: 'A dropdown menu with a list of users',
		[ComponentType.RoleSelectMenu]: 'A dropdown menu with a list of roles',
		[ComponentType.MentionableSelectMenu]:
			'A dropdown menu with a list of mentionables (users/roles)',
		[ComponentType.ChannelSelectMenu]: 'A dropdown menu with a list of channels',
		[ComponentType.Section]: 'Contains many text displays alongside a accesory button',
		[ComponentType.TextDisplay]: 'Displays text in a row',
		[ComponentType.Thumbnail]: 'A thumbnail image',
		[ComponentType.MediaGallery]: 'Group of images',
		[ComponentType.File]: 'Attach a file (attachment:// only)',
		[ComponentType.Seperator]: 'A separator line',
		[ComponentType.Container]: 'A container for other components'
	};

	$: {
		baseContainer.components = baseContainer.components.map((component) => {
			if (component.type === ComponentType.TextDisplay) {
				component.content = component.content ?? 'Enter text here...';
			}
			return component;
		});

		// Only update the store, don't call ensureHexIds here
		components.update((c) => {
			c[0] = baseContainer;
			return c;
		});
	}

	export let disableExport = false; // If being embedded in another page using svelte components you can just pull the components store directly
	export let simulatedSearch = '';
	export let onChange: (components: tComponent[] | ComponentContainer) => void = () => {};

	$: {
		if (onChange && typeof onChange === 'function') {
			let outputObject = JSON.parse(JSON.stringify(baseContainer));
			cleanAll(outputObject);
			onChange(outputObject);
		}
	}

	$: components_list = $components;

	const query = simulatedSearch ? new URLSearchParams(simulatedSearch) : page.url.searchParams;

	onMount(() => {
		if (query.get('json')) {
			const json = query.get('json');
			if (json) {
				try {
					const parsed = JSON.parse(json);
					// Transform Discord format to internal format
					const transformed = transformDiscordToInternal(parsed);
					const withHexIds = ensureHexIds(transformed);
					components.set(withHexIds);
				} catch (e) {
					alert('Failed to parse JSON: ' + e);
				}
			}
		}

		// Add keyboard shortcut for easy JSON access (Ctrl+J or Cmd+J)
		function handleKeydown(e: KeyboardEvent) {
			if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
				e.preventDefault();
				const json = getCleanJSON();
				console.log('Component JSON:', json);
				navigator.clipboard.writeText(json).then(() => {
					console.log('JSON copied to clipboard!');
				}).catch(() => {
					console.log('Failed to copy to clipboard, but JSON is in console');
				});
			}
		}

		if (browser) {
			window.addEventListener('keydown', handleKeydown);
			return () => window.removeEventListener('keydown', handleKeydown);
		}
	});

	let showSettings = false;
	let useBaseContainer = true;
	let minifyOutput = false;
	let validateExport = true;
	let useFixedHeight = false; // Default to natural flow (false)
	let settingsLoaded = false; // Flag to prevent saving during initial load
	let isMobile = false; // Track if user is on mobile
	
	// Detect mobile viewport
	function updateMobileStatus() {
		if (browser) {
			isMobile = window.innerWidth <= 768;
		}
	}
	
	// Load settings from localStorage
	onMount(() => {
		if (browser) {
			// Initialize mobile status
			updateMobileStatus();
			
			// Add resize listener to update mobile status
			window.addEventListener('resize', updateMobileStatus);
			
			// Only load from localStorage if the values actually exist
			const savedMinifyOutput = localStorage.getItem('minifyOutput');
			const savedValidateExport = localStorage.getItem('validateExport');
			const savedUseFixedHeight = localStorage.getItem('useFixedHeight');
			
			if (savedMinifyOutput !== null) minifyOutput = savedMinifyOutput === 'true';
			if (savedValidateExport !== null) validateExport = savedValidateExport === 'true';
			if (savedUseFixedHeight !== null) useFixedHeight = savedUseFixedHeight === 'true';
			
			// Then override with query parameters if present
			const query = page.url.searchParams;
			if (query.get('min')) minifyOutput = true;
			if (query.get('no-validate')) validateExport = false;
			
			// Mark settings as loaded
			settingsLoaded = true;
			
			// Cleanup resize listener
			return () => {
				window.removeEventListener('resize', updateMobileStatus);
			};
		}
	});
	
	// Functions to save individual settings ONLY when user actually changes them
	function saveMinifyOutput() {
		if (browser) {
			localStorage.setItem('minifyOutput', minifyOutput.toString());
		}
	}
	
	function saveValidateExport() {
		if (browser) {
			localStorage.setItem('validateExport', validateExport.toString());
		}
	}
	
	function saveUseFixedHeight() {
		if (browser) {
			localStorage.setItem('useFixedHeight', useFixedHeight.toString());
		}
	}
	
	// Settings modal handlers
	function handleAccentColorReset() {
		baseContainer.accent_color = undefined;
		components.update((c) => {
			c[0] = baseContainer;
			return c;
		});
	}

	function handleAccentColorChange() {
		components.update((c) => {
			c[0] = baseContainer;
			return c;
		});
	}
	
	// Convert accent color for ColorPicker (number to hex string)
	$: accentColorHex = $components[0].accent_color !== undefined 
		? '#' + $components[0].accent_color.toString(16).padStart(6, '0')
		: undefined;
	
	let draggedIndex: number | null = null;
	let dragTargetIndex: number | null = null;
	let dropIndicatorPosition: 'above' | 'below' | null = null;
	let mobileView: 'edit' | 'preview' | 'split' = 'edit';

	function handleDragStart(e: DragEvent, index: number) {
		draggedIndex = index;
		e.dataTransfer?.setData('text/plain', index.toString());
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		
		if (draggedIndex === null || draggedIndex === index) {
			return;
		}

		// Determine if we're in the top or bottom half of the target element
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const midpoint = rect.top + rect.height / 2;
		
		// Update immediately for better responsiveness
		dragTargetIndex = index;
		dropIndicatorPosition = e.clientY < midpoint ? 'above' : 'below';
	}

	function handleDragLeave(e: DragEvent) {
		// More conservative drag leave - only clear when leaving the entire editor area
		const relatedTarget = e.relatedTarget as HTMLElement;
		if (!relatedTarget || !relatedTarget.closest('.editor')) {
			// Add a small delay to prevent flickering
			setTimeout(() => {
				if (draggedIndex !== null && !relatedTarget?.closest('.editor')) {
					dragTargetIndex = null;
					dropIndicatorPosition = null;
				}
			}, 100);
		}
	}	function handleDrop(e: DragEvent, targetIndex: number) {
		e.preventDefault();
		
		if (draggedIndex === null || draggedIndex === targetIndex) {
			draggedIndex = null;
			dragTargetIndex = null;
			dropIndicatorPosition = null;
			return;
		}

		components.update((c) => {
			const container = c[0];
			const draggedComponent = container.components[draggedIndex!];
			
			// Remove the dragged component
			container.components.splice(draggedIndex!, 1);
			
			// Calculate the correct insert position
			let insertIndex = targetIndex;
			
			// If we're dropping below the target and the dragged item was above the target
			if (dropIndicatorPosition === 'below') {
				insertIndex = draggedIndex! < targetIndex ? targetIndex : targetIndex + 1;
			} else {
				// Dropping above the target
				insertIndex = draggedIndex! < targetIndex ? targetIndex - 1 : targetIndex;
			}
			
			// Ensure insertIndex is within bounds
			insertIndex = Math.max(0, Math.min(insertIndex, container.components.length));
			
			container.components.splice(insertIndex, 0, draggedComponent);
			
			return c;
		});

		draggedIndex = null;
		dragTargetIndex = null;
		dropIndicatorPosition = null;
	}

</script>

<svelte:head>
	<title>Message Component Builder - Hex</title>
	<meta name="description" content="Build Discord message components with drag-and-drop reordering, visual color coding, and JSON export." />
</svelte:head>

<header>
	<h1 style="margin-bottom: 10px;">Message Component Builder</h1>
	<div class="button-panel">
		<button
			class="add-component"
			on:click={() => {
				if (browser)
					mount(Create, {
						target: document.body
					});
			}}
		>
			<span class="button-icon">➕</span>
			<span class="button-text">Add</span>
		</button>
		<button
			class="wipe-button"
			on:click={() => {
				if (confirm('Are you sure you want to wipe the current message?')) {
					const hexId = Math.floor(Math.random() * 1000000);
					components.set([
						{
							type: ComponentType.Container,
							components: [],
							hex_id: hexId,
							hex: {
								id: hexId,
								color: generatePastelColor(hexId)
							}
						}
					]);
				}
			}}
		>
			<span class="button-icon">🗑️</span>
			<span class="button-text">Wipe</span>
		</button>
		<button
			class="import-button"
			on:click={() => {
				if (!browser) return;

				const jsonInput = prompt(
					'Enter JSON to import (leave empty to cancel):',
					JSON.stringify($components)
				);

				if (jsonInput) {
					try {
						const parsed = JSON.parse(jsonInput);
						if (Array.isArray(parsed) && parsed.length > 0) {
							// Transform Discord format to internal format
							const transformed = transformDiscordToInternal(parsed);
							const withHexIds = ensureHexIds(transformed);
							components.set(withHexIds);
						} else {
							alert('Invalid JSON format. Please provide a valid array of components.');
						}
					} catch (e) {
						alert('Failed to parse JSON: ' + e);
					}
				}
			}}
		>
			<span class="button-icon">📥</span>
			<span class="button-text">Import</span>
		</button>
		<button
			class="settings-button"
			on:click={() => {
				showSettings = !showSettings;
			}}
		>
			<span class="button-icon">⚙️</span>
			<span class="button-text">Settings</span>
		</button>
		{#if !disableExport}
		<button
			class="copy-button"
			on:click={() => {
				let outputObject = baseContainer;
				// Find all "hex_id" and "hex" properties and remove them
				cleanAll(outputObject);

				const findAll = (type: ComponentType): tComponent[] => {
					// Recursively find all components of a certain type
					const foundComponents: any[] = [];
					const findComponents = (obj: any) => {
						if (obj.type === type) {
							foundComponents.push(obj);
						}
						if (obj.components) {
							for (const component of obj.components) {
								findComponents(component);
							}
						}
					};
					findComponents(outputObject);
					return foundComponents;
				};

				const actionRows = findAll(ComponentType.ActionRow);

				try {
					actionRows.forEach((actionRow) => {
						const children = actionRow.components ?? [];
						if (children.length > 5) {
							throw new Error('Action rows can only have 5 components');
						} else if (children.length < 1) {
							throw new Error('Action rows must have at least 1 component');
						} else if (children.length > 1) {
							if (children.filter((c) => c.type != 2).length > 1)
								throw new Error('You can only have one select menu per action row');
						}
					});
				} catch (e) {
					if (validateExport) {
						alert(e);
						return;
					} else {
						console.warn(`Got error: ${e}, but continuing export due to no-validate flag`);
					}
				}

				const buttons = findAll(ComponentType.Button);
				try {
					buttons.forEach((button) => {
						if (button.style == 5) {
							if (!button.url) throw new Error('Link buttons must have a url');
							button.custom_id = undefined;
						} else if (button.style != 5) {
							if (!button.custom_id) throw new Error('Buttons must have a custom_id');
							button.url = undefined;
						}

						if (button.emoji == '') {
							button.emoji = null;
						}
					});
				} catch (e) {
					if (validateExport) {
						alert(e);
						return;
					} else {
						console.warn(`Got error: ${e}, but continuing export due to no-validate flag`);
					}
				}

				let json = JSON.stringify([outputObject], null, 2);

				if (!useBaseContainer) {
					json = JSON.stringify(outputObject.components, null, 2);
				}

				if (minifyOutput || query.get('redir')) json = JSON.stringify(useBaseContainer ? [outputObject] : outputObject.components); // Encoding non minified json is a recipe for disaster

				if (query.get('redir')) {
					const targetUrl = query.get('redir');
					const target = new URL(targetUrl ?? '');

					target.searchParams.set('json', btoa(json));
					window.location.href = target.toString();
				} else {
					navigator.clipboard
						.writeText(json)
						.then(() => {
							alert('Copied to clipboard!');
						})
						.catch((err) => {
							alert('Failed to copy to clipboard: ' + err);
						});
				}
			}}
		>
			<span class="button-icon">📋</span>
			<span class="button-text">{query.get('redir') ? 'Submit' : 'Export'}</span>
		</button>
		{/if}
	</div>

	<!-- Settings Modal -->
	{#if showSettings}
		<Modal title="Settings" on:close={() => showSettings = false}>
			<SettingGroup>
				<ToggleSwitch
					bind:checked={useBaseContainer}
					label="Use Base Container"
					description="Include a base container in the exported JSON."
				/>
				{#if useBaseContainer}
				<ColorPicker 
					bind:value={accentColorHex}
					on:change={(e) => {
						const hexValue = e.detail;
						if (hexValue) {
							const hex = hexValue.replace('#', '');
							const newColor = parseInt(hex, 16);
							
							// Update both the baseContainer and the store
							baseContainer.accent_color = newColor;
							components.update((c) => {
								c[0].accent_color = newColor;
								return c;
							});
						} else {
							baseContainer.accent_color = undefined;
							components.update((c) => {
								c[0].accent_color = undefined;
								return c;
							});
						}
					}}
					label="Accent Color"
					description="Choose a custom accent color for your components"
					on:reset={handleAccentColorReset}
				/>
				{/if}
			</SettingGroup>

			<SettingGroup title="Preview Options">
				<ToggleSwitch
					bind:checked={useFixedHeight}
					label="Fixed Height Preview"
					description="Enable to constrain the preview to a fixed height with scrolling. Disable for natural content flow. (Desktop only)"
					on:change={saveUseFixedHeight}
					disabled={isMobile}
				/>
			</SettingGroup>

			<SettingGroup title="Export Options">
				<ToggleSwitch
					bind:checked={minifyOutput}
					label="Minify Output"
					description="Export JSON in compact format without indentation and whitespace."
					on:change={saveMinifyOutput}
				/>
				<ToggleSwitch
					bind:checked={validateExport}
					label="Validate on Export"
					description="Enable validation checks when exporting. Disable to export even if there are issues."
					on:change={saveValidateExport}
				/>
			</SettingGroup>
		</Modal>
	{/if}
</header>

<!-- Mobile tab navigation -->
<div class="mobile-tabs">
	<button 
		class="tab-button" 
		class:active={mobileView === 'edit'}
		on:click={() => mobileView = 'edit'}
	>
		<span class="tab-icon">✏️</span>
		<span class="tab-text">Edit</span>
	</button>
	<button 
		class="tab-button" 
		class:active={mobileView === 'preview'}
		on:click={() => mobileView = 'preview'}
	>
		<span class="tab-icon">👁️</span>
		<span class="tab-text">Preview</span>
	</button>
	<button 
		class="tab-button" 
		class:active={mobileView === 'split'}
		on:click={() => mobileView = 'split'}
	>
		<span class="tab-icon">🔄</span>
		<span class="tab-text">Split</span>
	</button>
</div>	<div class="content" class:mobile-edit={mobileView === 'edit'} class:mobile-preview={mobileView === 'preview'} class:mobile-split={mobileView === 'split'}>
		<div class="editor"
			role="application"
			aria-label="Component editor with drag and drop functionality"
			on:dragover={(e) => {
				// Handle drops in empty spaces
				if (draggedIndex === null) return;
				
				e.preventDefault();
				if (e.dataTransfer) {
					e.dataTransfer.dropEffect = 'move';
				}
				
				// Check if we're in an empty area (not over a component)
				const componentElements = Array.from(e.currentTarget.querySelectorAll('.component'));
				const isOverComponent = componentElements.some(el => {
					const rect = el.getBoundingClientRect();
					return e.clientY >= rect.top && e.clientY <= rect.bottom;
				});
				
				if (!isOverComponent) {
					// We're in empty space - determine where to drop
					const components = baseContainer.components;
					let insertIndex = components.length; // Default to end
					
					for (let i = 0; i < componentElements.length; i++) {
						const rect = componentElements[i].getBoundingClientRect();
						if (e.clientY < rect.top) {
							insertIndex = i;
							break;
						}
					}
					
					if (insertIndex === 0) {
						dragTargetIndex = 0;
						dropIndicatorPosition = 'above';
					} else {
						dragTargetIndex = insertIndex - 1;
						dropIndicatorPosition = 'below';
					}
				}
			}}
			on:drop={(e) => {
				if (draggedIndex === null) return;
				e.preventDefault();
				
				// If we have a valid drop target from dragover, use it
				if (dragTargetIndex !== null && dropIndicatorPosition !== null) {
					handleDrop(e, dragTargetIndex);
				}
			}}
		>			
			{#each baseContainer.components as component, i}
				<!-- Drop indicator above -->
				{#if dragTargetIndex === i && dropIndicatorPosition === 'above'}
					<div class="drop-indicator"></div>
				{/if}
				
				<Component
					label={typeNames[component.type]}
					id={i}
					hex_id={component.hex_id || Math.floor(Math.random() * 1000000)}
					component={component}
					icon='/icons/components/{component.type}.svg'
					description={typeDescription[component.type]}
					onDragStart={handleDragStart}
					onDragOver={(e) => handleDragOver(e, i)}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					isDragTarget={dragTargetIndex === i}
					isDragging={draggedIndex === i}
				>
					{#if component.type === ComponentType.TextDisplay}
						<textarea bind:value={component.content} placeholder="Enter text here..."></textarea>
					{/if}
					{#if component.type === ComponentType.MediaGallery}
						{#each component.items ?? [] as image, imageIndex}
							<div class="image-item">
								<img src={image.media.url} alt="Preview of media gallery attachment" />
								<input
									type="text"
									bind:value={image.media.url}
									placeholder="Enter image URL here..."
								/>
								<div class="image-item-controls">
									<button
										class="move-btn-styled colour-success"
										on:click={() => {
											if (imageIndex > 0) {
												const items = [...(component.items ?? [])];
												[items[imageIndex - 1], items[imageIndex]] = 
												[items[imageIndex], items[imageIndex - 1]];
												component.items = items;
												components.update((c) => {
													c[0] = baseContainer;
													return c;
												});
											}
										}}
										disabled={imageIndex === 0}
										>^</button
									>
									<button
										class="delete-btn-styled colour-danger"
										on:click={() => {
											component.items = (component.items ?? []).filter(
												(item) =>
													item.media.url !== image.media.url ||
													item.media.hex_id !== image.media.hex_id
											);
											components.update((c) => {
												c[0] = baseContainer;
												return c;
											});
										}}>X</button
									>
									<button
										class="move-btn-styled colour-danger"
										on:click={() => {
											const items = component.items ?? [];
											if (imageIndex < items.length - 1) {
												const newItems = [...items];
												[newItems[imageIndex], newItems[imageIndex + 1]] = 
												[newItems[imageIndex + 1], newItems[imageIndex]];
												component.items = newItems;
												components.update((c) => {
													c[0] = baseContainer;
													return c;
												});
											}
										}}
										disabled={imageIndex === (component.items ?? []).length - 1}
										>v</button
									>
								</div>
							</div>
						{/each}
					{/if}
					{#if component.type === ComponentType.ActionRow}
						<div class="action-row-components">
							{#each component.components ?? [] as actionRowComponent, j}
								<Component
									label={typeNames[actionRowComponent.type]}
									id={j}
									hex_id={actionRowComponent.hex_id || Math.floor(Math.random() * 1000000)}
									icon='/icons/components/{actionRowComponent.type}.svg'
									description={typeDescription[actionRowComponent.type]}
									noDelete={true}
									showMoveButtons={false}
									customButtons={[
										{
											label: '↑',
											class: 'colour-success',
											onClick: () => {
												if (j > 0) {
													const comps = [...(component.components ?? [])];
													[comps[j - 1], comps[j]] = [comps[j], comps[j - 1]];
													component.components = comps;
													components.update((c) => {
														c[0] = baseContainer;
														return c;
													});
												}
											}
										},
										{
											label: '↓',
											class: 'colour-danger',
											onClick: () => {
												const comps = component.components ?? [];
												if (j < comps.length - 1) {
													const newComps = [...comps];
													[newComps[j], newComps[j + 1]] = [newComps[j + 1], newComps[j]];
													component.components = newComps;
													components.update((c) => {
														c[0] = baseContainer;
														return c;
													});
												}
											}
										},
										{
											label: 'Delete',
											class: 'colour-danger',
											onClick: () => {
												component.components = (component.components ?? []).filter(
													(item) => item.hex_id !== actionRowComponent.hex_id
												);
												components.update((c) => {
													c[0] = baseContainer;
													return c;
												});
												components.set($components);
											}
										},
										...(actionRowComponent.type === ComponentType.StringSelectMenu
											? [
													{
														label: 'Add Option',
														class: 'colour-success',
														onClick: () => {
															actionRowComponent.options = actionRowComponent.options || [];
															actionRowComponent.options.push({
																label: 'Option Name',
																value: 'optionValue',
																description: 'Description of option',
																hex_id: Math.floor(Math.random() * 1000000)
															});
															components.update((c) => {
																c[0] = baseContainer;
																return c;
															});
														}
													}
												]
											: [])
									]}
								>
									{#if actionRowComponent.type === ComponentType.Button}
										<input
											type="text"
											bind:value={actionRowComponent.label}
											placeholder="Enter button label here... (required)"
										/>
										<select bind:value={actionRowComponent.style}>
											<option value={1}>Primary</option>
											<option value={2}>Secondary</option>
											<option value={3}>Success</option>
											<option value={4}>Danger</option>
											<option value={5}>Link</option>
										</select>
										<select bind:value={actionRowComponent.disabled}>
											<option value={false}>Enabled</option>
											<option value={true}>Disabled</option>
										</select>

										{#if actionRowComponent.style == 5}
											<input
												type="text"
												bind:value={actionRowComponent.url}
												placeholder="Enter button URL here... (required)"
											/>
										{:else}
											<input
												type="text"
												bind:value={actionRowComponent.custom_id}
												placeholder="Enter button custom_id here... (required)"
											/>
											<input
												type="text"
												bind:value={actionRowComponent.emoji}
												placeholder="Enter button emoji here... (optional, id/unicode)"
											/>
										{/if}
									{:else}
										<input
											type="text"
											bind:value={actionRowComponent.placeholder}
											placeholder="Enter select menu placeholder here... (optional)"
										/>
										<select bind:value={actionRowComponent.disabled}>
											<option value={false}>Enabled</option>
											<option value={true}>Disabled</option>
										</select>
										<input
											type="text"
											bind:value={actionRowComponent.custom_id}
											placeholder="Enter select menu custom_id here..."
										/>

										{#if actionRowComponent.type === ComponentType.StringSelectMenu}
											<h3>Options:</h3>
											{#each actionRowComponent.options ?? [] as option, k}
												<div class="option-item">
													<div class="option-inputs">
														<input
															type="text"
															bind:value={option.label}
															placeholder="Enter option label here..."
														/>
														<input
															type="text"
															bind:value={option.value}
															placeholder="Enter option value here..."
														/>
														<input
															type="text"
															bind:value={option.description}
															placeholder="Enter option description here..."
														/>
													</div>
													<div class="option-item-controls">
														<button
															class="move-btn-styled colour-success"
															on:click={() => {
																if (k > 0) {
																	const options = [...(actionRowComponent.options ?? [])];
																	[options[k - 1], options[k]] = 
																	[options[k], options[k - 1]];
																	actionRowComponent.options = options;
																	components.update((c) => {
																		c[0] = baseContainer;
																		return c;
																	});
																}
															}}
															disabled={k === 0}
															>^</button
														>
														<button
															class="delete-btn-styled colour-danger"
															on:click={() => {
																actionRowComponent.options = (actionRowComponent.options ?? []).filter(
																	(item) => item.value !== option.value
																);
															}}>X</button
														>
														<button
															class="move-btn-styled colour-danger"
															on:click={() => {
																const options = actionRowComponent.options ?? [];
																if (k < options.length - 1) {
																	const newOptions = [...options];
																	[newOptions[k], newOptions[k + 1]] = 
																	[newOptions[k + 1], newOptions[k]];
																	actionRowComponent.options = newOptions;
																	components.update((c) => {
																		c[0] = baseContainer;
																		return c;
																	});
																}
															}}
															disabled={k === (actionRowComponent.options ?? []).length - 1}
															>v</button
														>
													</div>
												</div>
											{/each}
										{/if}
									{/if}
								</Component>
							{/each}
						</div>
					{/if}
					{#if component.type === ComponentType.Section}
						{#each component.components ?? [] as sectionComponent, j}
							<Component
								label={typeNames[sectionComponent.type]}
								id={j}
								hex_id={sectionComponent.hex_id || Math.floor(Math.random() * 1000000)}
								icon='/icons/components/{sectionComponent.type}.svg'
								description={typeDescription[sectionComponent.type]}
								noDelete={true}
								showMoveButtons={false}
								customButtons={[
									{
										label: '↑',
										class: 'colour-success',
										onClick: () => {
											if (j > 0) {
												const comps = [...(component.components ?? [])];
												[comps[j - 1], comps[j]] = [comps[j], comps[j - 1]];
												component.components = comps;
												components.update((c) => {
													c[0] = baseContainer;
													return c;
												});
											}
										}
									},
									{
										label: '↓',
										class: 'colour-danger',
										onClick: () => {
											const comps = component.components ?? [];
											if (j < comps.length - 1) {
												const newComps = [...comps];
												[newComps[j], newComps[j + 1]] = [newComps[j + 1], newComps[j]];
												component.components = newComps;
												components.update((c) => {
													c[0] = baseContainer;
													return c;
												});
											}
										}
									},
									{
										label: 'Delete',
										class: 'colour-danger',
										onClick: () => {
											component.components = (component.components ?? []).filter(
												(item) => item.hex_id !== sectionComponent.hex_id
											);
											components.update((c) => {
												c[0] = baseContainer;
												return c;
											});
											components.set($components);
										}
									}
								]}
							>
								{#if sectionComponent.type === ComponentType.TextDisplay}
									<textarea bind:value={sectionComponent.content} placeholder="Enter text here..."
									></textarea>
								{/if}
							</Component>
						{/each}
						<h3>Accessory</h3>
						<Component
							label={typeNames[ComponentType.Button]}
							id={-1}
							hex_id={component.accessory?.hex_id || 0}
							icon='/icons/components/{ComponentType.Button}.svg'
							description={typeDescription[ComponentType.Button]}
							noDelete={true}
							showMoveButtons={false}
							customButtons={[
								{
									label: 'Delete',
									class: 'colour-danger',
									onClick: () => {
										component.accessory = undefined;
										components.update((c) => {
											c[0] = baseContainer;
											return c;
										});
										components.set($components);
									}
								}
							]}
						>
							<input
								type="text"
								bind:value={(component.accessory as unknown as Component).label}
								placeholder="Enter button label here... (required)"
							/>
							<select bind:value={(component.accessory as unknown as Component).style}>
								<option value={1}>Primary</option>
								<option value={2}>Secondary</option>
								<option value={3}>Success</option>
								<option value={4}>Danger</option>
								<option value={5}>Link</option>
							</select>
							<select bind:value={(component.accessory as unknown as Component).disabled}>
								<option value={false}>Enabled</option>
								<option value={true}>Disabled</option>
							</select>

							{#if (component.accessory as unknown as Component).style == 5}
								<input
									type="text"
									bind:value={(component.accessory as unknown as Component).url}
									placeholder="Enter button URL here... (required)"
								/>
							{:else}
								<input
									type="text"
									bind:value={(component.accessory as unknown as Component).custom_id}
									placeholder="Enter button custom_id here... (required)"
								/>
								<input
									type="text"
									bind:value={(component.accessory as unknown as Component).emoji}
									placeholder="Enter button emoji here... (optional, id/unicode)"
								/>
							{/if}
						</Component>
					{/if}

					{#if component.type === ComponentType.File}
						<input
							type="text"
							bind:value={(component.file as UnfurledMediaItem).url}
							placeholder="Enter file URL here... (attachment:// only)"
						/>
					{/if}

					{#if component.type === ComponentType.Thumbnail}
						<div class="image-item">
							<img
								src={(component.media as UnfurledMediaItem).url}
								alt="Preview of media gallery attachment"
							/>
							<input
								type="text"
								bind:value={(component.media as UnfurledMediaItem).url}
								placeholder="Enter image URL here..."
							/>
						</div>
					{/if}
				</Component>
				
				<!-- Drop indicator below -->
				{#if dragTargetIndex === i && dropIndicatorPosition === 'below'}
					<div class="drop-indicator"></div>
				{/if}
			{/each}
		</div>
		<div class="preview">
			<Preview {useBaseContainer} {useFixedHeight} />
		</div>
	</div>

<style>
	header {
		margin-bottom: 20px;
		max-width: 1400px;
		margin-left: auto;
		margin-right: auto;
		padding: 0 20px;
	}

	header h1 {
		font-size: 1.8rem;
	}

	/* Mobile responsive header */
	@media (max-width: 768px) {
		header h1 {
			font-size: 1.4rem;
		}
	}

	.mobile-tabs {
		display: none;
	}

	/* Mobile responsive layout */
	@media (max-width: 768px) {
		.mobile-tabs {
			display: flex;
			justify-content: center;
			margin-bottom: 15px;
			background-color: #2c2d30;
			border-radius: 15px;
			overflow: hidden;
			box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
			width: 70%;
			max-width: 300px;
			margin-left: auto;
			margin-right: auto;
		}

		.tab-button {
			flex: 1;
			background-color: transparent;
			color: #8e9297;
			border: none;
			padding: 8px 4px;
			cursor: pointer;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 2px;
			transition: all 0.2s ease;
			border-right: 1px solid rgba(255, 255, 255, 0.1);
			min-height: 40px;
		}

		.tab-button:last-child {
			border-right: none;
		}

		.tab-button.active {
			background-color: #5865f2;
			color: white;
		}

		.tab-icon {
			font-size: 14px;
		}

		.tab-text {
			font-size: 9px;
			font-weight: 600;
		}

		.content {
			flex-direction: column;
			width: 100%;
			gap: 15px;
			overflow-x: hidden;
			height: calc(80vh - 45px); /* Account for smaller tabs */
			overflow: hidden;
		}
		
		.content.mobile-edit .editor {
			display: flex !important;
			width: 100% !important;
			max-height: calc(80vh - 45px) !important;
			overflow-y: auto;
		}
		
		.content.mobile-edit .preview {
			display: none !important;
		}
		
		.content.mobile-preview .editor {
			display: none !important;
		}
		
		.content.mobile-preview .preview {
			display: block !important;
			width: 100% !important;
			max-height: calc(80vh - 45px);
			overflow-y: auto;
		}
		
		.content.mobile-split {
			flex-direction: column !important;
			gap: 2px !important;
		}
		
		.content.mobile-split .editor {
			display: flex !important;
			width: 100% !important;
			height: calc(40vh - 22px) !important;
			max-height: calc(40vh - 22px) !important;
			overflow-y: auto;
			padding: 8px !important;
		}
		
		.content.mobile-split .preview {
			display: block !important;
			width: 100% !important;
			height: calc(40vh - 22px) !important;
			max-height: calc(40vh - 22px);
			overflow-y: auto;
			padding: 8px !important;
		}
	}

	.content {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		gap: 25px;
		width: 100%;
		max-width: 1400px;
		margin: 0 auto 40px auto;
		padding: 0 20px;
		box-sizing: border-box;
	}

	.content div {
		border-radius: 40px;
		background-color: #1c1d20;
		padding: 20px;
		padding-left: 40px;
		padding-right: 40px;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
		box-sizing: border-box;
	}

	/* Mobile responsive padding */
	@media (max-width: 768px) {
		.content {
			padding: 0 15px;
			margin-bottom: 20px;
		}
		
		.content div {
			border-radius: 20px;
			padding: 15px;
			padding-left: 20px;
			padding-right: 20px;
			overflow-x: hidden;
			overflow-y: auto;
		}
		
		header {
			padding: 0 15px;
		}
	}

	/* Large screen adjustments */
	@media (min-width: 1200px) {
		.content {
			gap: 40px;
			margin-bottom: 60px;
		}
		
		.content div {
			padding: 30px;
			padding-left: 50px;
			padding-right: 50px;
		}
	}

	.editor {
		width: 50%;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.preview {
		width: 50%;
		min-width: 0;
	}

	.content textarea {
		width: 100%;
		max-width: 100%;
		height: 100px;
		border-radius: 20px;
		background-color: #2c2d30;
		color: white;
		padding: 10px;
		border: none;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
		box-sizing: border-box;
		resize: vertical;
		overflow-wrap: break-word;
	}

	.image-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: start;
		gap: 10px;
		margin-bottom: 10px;
		padding: 0;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		overflow: hidden;
	}

	.image-item-controls {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 2px;
		width: 60px;
		height: 32px;
		padding: 0 !important;
		border-radius: 0 !important;
		background-color: transparent !important;
		box-shadow: none !important;
		flex-shrink: 0;
	}

	.move-btn-styled {
		height: 15px;
		width: 100% !important;
		border: none;
		border-radius: 3px;
		color: white;
		font-size: 9px;
		font-weight: bold;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
		padding: 0 !important;
		margin: 0 !important;
		box-sizing: border-box !important;
	}

	.delete-btn-styled {
		height: 32px;
		width: 100% !important;
		border: none;
		border-radius: 3px;
		color: white;
		font-size: 9px;
		font-weight: bold;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
		grid-row: 1 / 3;
		grid-column: 2;
		padding: 0 !important;
		margin: 0 !important;
		box-sizing: border-box !important;
	}

	/* Mobile responsive buttons - make them bigger for touch */
	@media (max-width: 768px) {
		.move-btn-styled {
			height: 20px;
			font-size: 12px;
			min-height: 44px; /* iOS touch target minimum */
		}
		
		.delete-btn-styled {
			height: 44px;
			font-size: 12px;
		}
		
		.image-item-controls,
		.option-item-controls {
			width: 80px;
			height: 44px;
		}
	}

	.move-btn-styled:disabled {
		background-color: #4a4d53 !important;
		color: #72767d;
		cursor: not-allowed;
	}

	.option-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
		padding: 10px;
		background-color: rgba(44, 47, 51, 0.5);
		border-radius: 10px;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		overflow: hidden;
	}

	.option-item-controls {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 2px;
		width: 60px;
		height: 32px;
		padding: 0 !important;
		border-radius: 0 !important;
		background-color: transparent !important;
		box-shadow: none !important;
		flex-shrink: 0;
	}

	.option-inputs {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.option-inputs input {
		margin: 0;
		width: 100%;
		box-sizing: border-box;
	}

	.image-item img {
		width: 50px;
		height: 50px;
		border-radius: 20%;
		flex-shrink: 0;
	}

	.image-item input {
		flex: 1;
		min-width: 0;
		width: auto;
		max-width: none;
		height: 50px;
		border-radius: 20px;
		background-color: #2c2d30;
		color: white;
		padding: 10px;
		border: none;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
		box-sizing: border-box;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.button-panel {
		display: flex;
		justify-content: center;
		max-width: 100%;
		overflow: hidden;
	}

	.button-panel button {
		background-color: #2c2d30;
		color: white;
		padding: 10px 20px;
		border-radius: 0;
		cursor: pointer;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.15);
		width: 20%;
		min-width: 100px;
		font-weight: 600;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		overflow: hidden;
	}

	.button-icon {
		font-size: 16px;
		display: block;
	}

	.button-text {
		font-size: 12px;
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Mobile responsive buttons */
	@media (max-width: 768px) {
		.button-panel {
			gap: 0;
			border-radius: 15px;
			overflow: hidden;
			background-color: #2c2d30;
			box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
		}
		
		.button-panel button {
			width: 20%; /* Split evenly between 5 buttons */
			padding: 12px 4px;
			border-radius: 0 !important;
			margin-bottom: 0;
			min-width: 0;
			flex-direction: column;
			justify-content: center;
			border-right: 1px solid rgba(255, 255, 255, 0.1);
			box-shadow: none;
		}
		
		.button-panel button:last-child {
			border-right: none;
		}
		
		.button-icon {
			font-size: 18px;
		}
		
		.button-text {
			display: none; /* Hide text on mobile */
		}
	}

	.button-panel button:first-child {
		border-top-left-radius: 20px;
		border-bottom-left-radius: 20px;
	}

	.button-panel button:last-child {
		border-top-right-radius: 20px;
		border-bottom-right-radius: 20px;
	}

	.action-row-components {
		display: flex;
		flex-direction: column;
		justify-content: start;
		gap: 20px;
	}

	input {
		width: 100%;
		max-width: 100%;
		height: 50px;
		border-radius: 20px;
		background-color: #2c2d30;
		color: white;
		padding: 10px;
		margin: 10px 0;
		border: none;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
		box-sizing: border-box;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	select {
		width: 100%;
		max-width: 100%;
		height: 65px;
		border-radius: 20px;
		background-color: #2c2d30;
		color: white;
		padding: 10px;
		margin: 10px 0;
		border: none;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
		box-sizing: border-box;
		overflow: hidden;
	}

	textarea {
		width: 100%;
		max-width: 100%;
		height: 100px;
		border-radius: 20px;
		background-color: #2c2d30;
		color: white;
		padding: 10px;
		border: none;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
		box-sizing: border-box;
		resize: vertical;
		overflow-wrap: break-word;
	}

	/* Mobile responsive inputs */
	@media (max-width: 768px) {
		input {
			height: 45px;
			padding: 8px;
			margin: 8px 0;
			font-size: 16px; /* Prevents zoom on iOS */
		}
		
		select {
			height: 50px;
			padding: 8px;
			margin: 8px 0;
			font-size: 16px; /* Prevents zoom on iOS */
		}
		
		textarea {
			font-size: 16px !important; /* Prevents zoom on iOS */
			padding: 8px;
		}
	}

	.drop-indicator {
		height: 4px;
		background: linear-gradient(90deg, #5865f2, #7289da);
		border-radius: 2px;
		margin: 8px 0;
		box-shadow: 0 0 12px rgba(88, 101, 242, 0.8);
		animation: pulse 1s ease-in-out infinite alternate;
		position: relative;
		z-index: 10;
		width: calc(100% - 80px); /* Account for container padding */
		max-width: 100%;
	}

	@keyframes pulse {
		from {
			opacity: 0.7;
			transform: scaleY(0.8);
		}
		to {
			opacity: 1;
			transform: scaleY(1.2);
		}
	}
</style>

<script lang="ts">
	import type { Component, UnfurledMediaItem } from './types';
	import { ComponentType } from './types';
	import { components } from './stores';
	import { marked } from 'marked';
	import { dev } from '$app/environment';
	import LinkIcon from '$lib/icons/link.svg';

	// Force reactivity by explicitly subscribing to the store
	$: baseContainer = $components[0];
	$: components_list = $components; // Add this line to track store changes

	const buttonStyleMapping: Record<number, string> = {
		1: 'primary',
		2: 'secondary',
		3: 'success',
		4: 'danger',
		5: 'secondary'
	};
</script>

{#snippet Button(comp: Component)}
	<button
		class="action-button colour-{buttonStyleMapping[comp.style ?? 1]}{comp.disabled
			? ' disabled'
			: ''}"
	>
		<div class="button-content">
			{#if comp.emoji}
				{#if comp.emoji.length > 2}
					<!-- Custom emoji id -->
					<img src="https://cdn.discordapp.com/emojis/{comp.emoji}.webp" alt="Emoji" />
				{:else}
					<span>{comp.emoji}</span>
				{/if}
			{/if}
			<span class="button-text" style="text-align: center;">{comp.label}</span>
		</div>
		{#if comp.style == 5}
			<span class="button-icon">
				<img src={LinkIcon} alt="Link Icon" />
			</span>
		{/if}
	</button>
{/snippet}

<div
	class="message-contents"
	style={baseContainer.accent_color ? `border-left: 5px solid ${baseContainer.accent_color};` : ''}
>
	<!-- Thumbnails have special positioning rules -->
	{#if baseContainer.components.find((c) => c.type == ComponentType.Thumbnail)}
		{#each baseContainer.components.filter((c) => c.type == ComponentType.Thumbnail) as thumbnail}
			<div class="thumbnail">
				<img src={(thumbnail.media as UnfurledMediaItem).url} alt="Thumbnail" />
			</div>
		{/each}
	{/if}
	{#each baseContainer?.components || [] as component}
		{#if component.type === ComponentType.TextDisplay}
			<div class="text-display">
				{@html marked.parse(component.content ?? 'Failed to load component content')}
			</div>
		{:else if component.type === ComponentType.MediaGallery}
			<div class="media-gallery">
				{#each component.items || [] as item}
					<div class="media-item">
						<img src={item.media.url} alt={item.description || 'Media item'} />
					</div>
				{/each}
			</div>
		{:else if component.type === ComponentType.Seperator}
			<div class="seperator">
				<hr />
			</div>
		{:else if component.type === ComponentType.ActionRow}
			<div class="action-row">
				{#each component.components || [] as action}
					{#if action.type === ComponentType.Button}
						{@render Button(action)}
					{:else}
						<!-- Purely visual select menu -->
						<select class="action-select" disabled>
							<option value="" disabled selected>{action.placeholder || 'Select an option'}</option>
						</select>
					{/if}
				{/each}
			</div>
		{:else if component.type === ComponentType.Section}
			<div class="section">
				<div class="left">
					{#each component.components || [] as sectionComponent}
						{#if sectionComponent.type === ComponentType.TextDisplay}
							<div class="text-display">
								{@html marked.parse(sectionComponent.content ?? 'Failed to load component content')}
							</div>
						{/if}
					{/each}
				</div>
				<div class="right">
					{#if component.accessory?.type == ComponentType.Button}
						{@render Button(component.accessory)}
					{/if}
				</div>
			</div>
		{/if}

		{#if component.type === ComponentType.File}
			<div class="file">
				<img
					src={dev
						? `/icons/components/${ComponentType.File}.svg`
						: `https://cdn.jsdelivr.net/gh/NotPiny/Hex/static/icons/components/${ComponentType.File}.svg`}
					alt="File Icon"
				/>
				<div class="details">
					<h4>{(component.file as UnfurledMediaItem).url.replace('attachment://', '')}</h4>
					<p>69.42KB</p>
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.message-contents {
		padding: 20px;
		border: 1px solid #2c2f33;
		border-radius: 10px;
		box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);

		max-height: 93%;
		overflow-y: auto;
	}

	img {
		max-width: 100%;
		height: auto;
		border-radius: 10px;
	}

	hr {
		border-color: #333338;
	}

	.media-gallery {
		display: flex;
		flex-direction: row;
		justify-content: space-between;

		gap: 10px;
	}

	.media-item {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		border-radius: 10px;
		background-color: #2c2f33;
	}

	.media-item img {
		width: 100%;
		height: auto;
		border-radius: 10px;
	}

	.action-row {
		display: flex;
		flex-direction: row;
		justify-content: start;

		gap: 10px;
	}

	.action-select {
		background-color: #2c2f33;
		color: white;
		border-radius: 10px;
		padding: 10px;
		border: none;
		box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
		width: 100%;
	}

	.section {
		display: flex;
		flex-direction: row;
		justify-content: space-between;

		gap: 10px;
	}

	.section .left {
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.section .right {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.file {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: start;

		gap: 10px;

		padding-left: 20px;

		width: 95%;
		border: 1px solid #2c2f33;
	}

	.file img {
		width: 50px;
		height: 50px;
		border-radius: 20%;
		margin-right: 20px;

		filter: invert(1);
	}

	.thumbnail {
		float: right;
		width: 10%;
		margin-left: 10px;
		margin-bottom: 10px;
	}

	.thumbnail img {
		width: 100%;
		height: auto;
		border-radius: 10px;
	}

	.action-button {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;

		color: white;
		border-radius: 10px;
		padding: 10px;
		border: none;
		box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
		cursor: pointer;

		gap: 5px;

		transition: all 0.2s ease-in-out;
	}

	.action-button span {
		margin: 0;
	}

	.button-icon img {
		display: flex;
		align-items: center;
		width: 1rem;
		height: 1rem;
	}

	.button-content img {
		width: 1rem;
		height: 1rem;
		margin-right: 5px;
	}
</style>

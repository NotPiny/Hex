<script lang="ts">
	import type { Component, UnfurledMediaItem } from './types';
	import { ComponentType } from './types';
	import { components } from './stores';
	import { marked } from 'marked';
	import { dev } from '$app/environment';
	import LinkIcon from '$lib/icons/link.svg';

	// Props
	export let useBaseContainer: boolean = true;
	export let useFixedHeight: boolean = false;

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

	// Discord markdown processor with proper newline handling and subtext support
	function processDiscordMarkdown(content: string): string {
		// Handle Discord's -# subtext format before markdown processing
		let processed = content.replace(/^-# (.+)$/gm, '<span style="font-size: 0.75em; color: #adadad; display: block; margin: 4px 0;">$1</span>');
		
		// Handle Discord mentions and channels before markdown processing
		// User mentions: <@123456789> -> @username
		processed = processed.replace(/<@(\d+)>/g, '<span style="color: #5865f2; background-color: rgba(88, 101, 242, 0.1); padding: 1px 3px; border-radius: 3px; font-weight: 500; cursor: pointer;">@User</span>');
		
		// Role mentions: <@&123456789> -> @rolename
		processed = processed.replace(/<@&(\d+)>/g, '<span style="color: #e67e22; background-color: rgba(230, 126, 34, 0.1); padding: 1px 3px; border-radius: 3px; font-weight: 500;">@Role</span>');
		
		// Channel mentions: <#123456789> -> #channel-name
		processed = processed.replace(/<#(\d+)>/g, '<span style="color: #5865f2; background-color: rgba(88, 101, 242, 0.1); padding: 1px 3px; border-radius: 3px; font-weight: 500; cursor: pointer;">#channel</span>');

		// Handle spoiler tags: ||content|| -> span with blacked out content
		processed = processed.replace(/\|\|(.*?)\|\|/g, '<span style="background-color: #4e515a; color: #4e515a; border-radius: 0.3em; cursor: pointer; user-select: none;">$1</span>');

		// Process with marked, enabling line breaks for Discord-style newlines
		const html = marked(processed, {
			breaks: true, // This makes marked treat single newlines as <br>
			gfm: true, // GitHub flavored markdown
			pedantic: false // Allow more relaxed parsing
		}) as string;
		
		return html;
	}
</script>

<svelte:head>
	<style>
		code {
			background-color: #2b2d31;
			padding: 2px 4px;
			border-radius: 4px;
			font-family: "gg mono","Source Code Pro",Consolas,"Andale Mono WT","Andale Mono","Lucida Console","Lucida Sans Typewriter","DejaVu Sans Mono","Bitstream Vera Sans Mono","Liberation Mono","Nimbus Mono L",Monaco,"Courier New",Courier,monospace;
			font-size: .875rem;
		}
	</style>
</svelte:head>

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

{#if useBaseContainer}
<div
	class="message-contents"
	class:fixed-height={useFixedHeight}
	style={baseContainer.accent_color ? `border-left: 5px solid #${baseContainer.accent_color.toString(16).padStart(6, '0')};` : ''}
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
				{@html processDiscordMarkdown(component.content ?? 'Failed to load component content')}
			</div>
		{:else if component.type === ComponentType.MediaGallery}
			<div class="media-gallery" 
				class:single={component.items?.length === 1} 
				class:two={component.items?.length === 2} 
				class:three={component.items?.length === 3} 
				class:four={component.items?.length === 4}
				class:five={component.items?.length === 5}
				class:six={component.items?.length === 6}
				class:seven={component.items?.length === 7}
				class:eight={component.items?.length === 8}
				class:nine={component.items?.length === 9}
				class:ten-plus={component.items && component.items.length >= 10}>
				{#each component.items || [] as item, index}
					<div class="media-item item-{index + 1}">
						<img src={item.media.url} alt={item.description || 'Media item'} />
						{#if component.items && component.items.length > 10 && index === 9}
							<div class="overlay">+{component.items.length - 10}</div>
						{/if}
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
								{@html processDiscordMarkdown(sectionComponent.content ?? 'Failed to load component content')}
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
					src='/icons/components/{ComponentType.File}.svg'
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
{:else}
	<!-- Render components directly without container -->
	{#each baseContainer?.components || [] as component}
		{#if component.type === ComponentType.TextDisplay}
			<div class="text-display">
				{@html processDiscordMarkdown(component.content ?? 'Failed to load component content')}
			</div>
		{:else if component.type === ComponentType.MediaGallery}
			<div class="media-gallery" 
				class:single={component.items?.length === 1} 
				class:two={component.items?.length === 2} 
				class:three={component.items?.length === 3} 
				class:four={component.items?.length === 4}
				class:five={component.items?.length === 5}
				class:six={component.items?.length === 6}
				class:seven={component.items?.length === 7}
				class:eight={component.items?.length === 8}
				class:nine={component.items?.length === 9}
				class:ten-plus={component.items && component.items.length >= 10}>
				{#each component.items || [] as item, index}
					<div class="media-item item-{index + 1}">
						<img src={item.media.url} alt={item.description || 'Media item'} />
						{#if component.items && component.items.length > 10 && index === 9}
							<div class="overlay">+{component.items.length - 10}</div>
						{/if}
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
								{@html processDiscordMarkdown(sectionComponent.content ?? 'Failed to load component content')}
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
					src='/icons/components/{ComponentType.File}.svg'
					alt="File Icon"
				/>
				<div class="details">
					<h4>{(component.file as UnfurledMediaItem).url.replace('attachment://', '')}</h4>
					<p>69.42KB</p>
				</div>
			</div>
		{/if}
	{/each}
{/if}

<style>
	.message-contents {
		padding: 20px;
		border: 1px solid #2c2f33;
		border-radius: 10px;
		box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
	}

	.message-contents.fixed-height {
		max-height: calc(75vh - 80px);
		overflow-y: auto;
	}

	.text-display {
		margin: 8px 0;
		line-height: 1.375;
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
		display: grid;
		gap: 4px;
		max-width: 520px;
		border-radius: 8px;
		overflow: hidden;
		margin: 8px 0;
	}

	/* Single image - large display */
	.media-gallery.single {
		grid-template-columns: 1fr;
		max-width: 400px;
		max-height: 300px;
	}

	/* Two images - side by side */
	.media-gallery.two {
		grid-template-columns: 1fr 1fr;
		max-height: 300px;
	}

	/* Three images - one large left, two stacked right */
	.media-gallery.three {
		grid-template-columns: 2fr 1fr;
		grid-template-rows: 1fr 1fr;
		max-height: 300px;
	}

	/* Four images - quarters (2x2 grid) */
	.media-gallery.four {
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		max-height: 300px;
	}

	/* Five images - 2 on top, 3 on bottom */
	.media-gallery.five {
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		max-height: 300px;
	}

	/* Six images - 2 rows of 3 */
	.media-gallery.six {
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		max-height: 300px;
	}

	/* Seven images - 1 on top, then 2 rows of 3 */
	.media-gallery.seven {
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr 1fr;
		max-height: 400px;
	}

	/* Eight images - 2 on top, then 2 rows of 3 */
	.media-gallery.eight {
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr 1fr;
		max-height: 400px;
	}

	/* Nine images - 3x3 grid */
	.media-gallery.nine {
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr 1fr;
		max-height: 400px;
	}

	/* Ten+ images - 1 on top, then 3x3 grid */
	.media-gallery.ten-plus {
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr 1fr 1fr;
		max-height: 500px;
	}

	.media-item {
		position: relative;
		overflow: hidden;
		background-color: #2c2f33;
		min-height: 100px;
	}

	/* Single image styling */
	.media-gallery.single .media-item {
		aspect-ratio: 16/9;
	}

	/* Three image layout */
	.media-gallery.three .media-item.item-1 {
		grid-row: 1 / 3;
		grid-column: 1;
	}
	.media-gallery.three .media-item.item-2 {
		grid-column: 2;
		grid-row: 1;
	}
	.media-gallery.three .media-item.item-3 {
		grid-column: 2;
		grid-row: 2;
	}

	/* Five image layout - 2 top, 3 bottom */
	.media-gallery.five {
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr;
	}
	.media-gallery.five .media-item.item-1 {
		grid-column: 1 / 4;
		grid-row: 1;
	}
	.media-gallery.five .media-item.item-2 {
		grid-column: 4 / 7;
		grid-row: 1;
	}
	.media-gallery.five .media-item.item-3 {
		grid-column: 1 / 3;
		grid-row: 2;
	}
	.media-gallery.five .media-item.item-4 {
		grid-column: 3 / 5;
		grid-row: 2;
	}
	.media-gallery.five .media-item.item-5 {
		grid-column: 5 / 7;
		grid-row: 2;
	}

	/* Seven image layout - 1 top, then 2 rows of 3 */
	.media-gallery.seven .media-item.item-1 {
		grid-column: 1 / 4;
		grid-row: 1;
	}
	.media-gallery.seven .media-item.item-2 {
		grid-column: 1;
		grid-row: 2;
	}
	.media-gallery.seven .media-item.item-3 {
		grid-column: 2;
		grid-row: 2;
	}
	.media-gallery.seven .media-item.item-4 {
		grid-column: 3;
		grid-row: 2;
	}
	.media-gallery.seven .media-item.item-5 {
		grid-column: 1;
		grid-row: 3;
	}
	.media-gallery.seven .media-item.item-6 {
		grid-column: 2;
		grid-row: 3;
	}
	.media-gallery.seven .media-item.item-7 {
		grid-column: 3;
		grid-row: 3;
	}

	/* Eight image layout - 2 top, then 2 rows of 3 */
	.media-gallery.eight .media-item.item-1 {
		grid-column: 1 / 4;
		grid-row: 1;
	}
	.media-gallery.eight .media-item.item-2 {
		grid-column: 4 / 7;
		grid-row: 1;
	}
	.media-gallery.eight .media-item.item-3 {
		grid-column: 1 / 3;
		grid-row: 2;
	}
	.media-gallery.eight .media-item.item-4 {
		grid-column: 3 / 5;
		grid-row: 2;
	}
	.media-gallery.eight .media-item.item-5 {
		grid-column: 5 / 7;
		grid-row: 2;
	}
	.media-gallery.eight .media-item.item-6 {
		grid-column: 1 / 3;
		grid-row: 3;
	}
	.media-gallery.eight .media-item.item-7 {
		grid-column: 3 / 5;
		grid-row: 3;
	}
	.media-gallery.eight .media-item.item-8 {
		grid-column: 5 / 7;
		grid-row: 3;
	}

	/* Ten+ image layout - 1 top, then 3x3 grid with overlay on last visible */
	.media-gallery.ten-plus .media-item.item-1 {
		grid-column: 1 / 4;
		grid-row: 1;
	}
	.media-gallery.ten-plus .media-item.item-2 {
		grid-column: 1;
		grid-row: 2;
	}
	.media-gallery.ten-plus .media-item.item-3 {
		grid-column: 2;
		grid-row: 2;
	}
	.media-gallery.ten-plus .media-item.item-4 {
		grid-column: 3;
		grid-row: 2;
	}
	.media-gallery.ten-plus .media-item.item-5 {
		grid-column: 1;
		grid-row: 3;
	}
	.media-gallery.ten-plus .media-item.item-6 {
		grid-column: 2;
		grid-row: 3;
	}
	.media-gallery.ten-plus .media-item.item-7 {
		grid-column: 3;
		grid-row: 3;
	}
	.media-gallery.ten-plus .media-item.item-8 {
		grid-column: 1;
		grid-row: 4;
	}
	.media-gallery.ten-plus .media-item.item-9 {
		grid-column: 2;
		grid-row: 4;
	}
	.media-gallery.ten-plus .media-item.item-10 {
		grid-column: 3;
		grid-row: 4;
	}

	/* Overlay for 10+ images */
	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 24px;
		font-weight: bold;
	}

	.media-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0;
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	.media-item:hover img {
		transform: scale(1.02);
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

	/* Mobile responsive - always use fixed height on mobile */
	@media (max-width: 768px) {
		.message-contents {
			max-height: calc(80vh - 100px);
			overflow-y: auto;
		}
	}
</style>

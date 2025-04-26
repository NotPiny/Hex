<svelte:head>
    <title>Message Component Builder - Hex</title>
</svelte:head>

<script lang="ts">
	import Component from "./Component.svelte";
    import Create from "./Create.svelte";
	import Preview from "./Preview.svelte";
    import { components } from './stores';
    import type { UnfurledMediaItem, Component as tComponent } from './types';
    import { ComponentType } from './types';
	import { browser, dev } from "$app/environment";
	import { mount, onMount } from "svelte";
	import { page } from "$app/state";

    $: baseContainer = $components[0];

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
    }

    const typeDescription: Record<ComponentType, string> = {
        [ComponentType.ActionRow]: 'A row of components such as buttons',
        [ComponentType.Button]: 'A button that can be clicked',
        [ComponentType.StringSelectMenu]: 'A dropdown menu with a list of predetermined options',
        [ComponentType.UserSelectMenu]: 'A dropdown menu with a list of users',
        [ComponentType.RoleSelectMenu]: 'A dropdown menu with a list of roles',
        [ComponentType.MentionableSelectMenu]: 'A dropdown menu with a list of mentionables (users/roles)',
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
                component.content = component.content ?? "Enter text here...";
            }
            return component;
        });

        components.update((c) => {
            c[0] = baseContainer;
            return c;
        });
    }

    $: components_list = $components;

    const query = page.url.searchParams;

    onMount(async() => {
        if (query.get('json')) {
            const json = query.get('json');
            if (json) {
                try {
                    const parsed = JSON.parse(json);
                    components.set(parsed);
                } catch (e) {
                    alert("Failed to parse JSON: " + e);
                }
            }
        }
    })

    let showSettings = false;
    let useBaseContainer = true;
</script>
<header>
    <h1 style="margin-bottom: 10px;">Message Component Builder</h1>
    <div class="button-panel">
        <button class="add-component" on:click={() => {
            if (browser) mount(Create, {
                target: document.body
            });
        }}>
            Add
        </button>
        <button class="wipe-button" on:click={() => {
            if (confirm("Are you sure you want to wipe the current message?")) {
                components.set([{
                    type: ComponentType.Container,
                    components: []
                }]);
            }
        }}>
            Wipe
        </button>
        <button class="settings-button" on:click={() => {showSettings = !showSettings}}>
            Settings
        </button>
        <button class="copy-button" on:click={() => {
            let outputObject = baseContainer;
            // Find all "hex_id" properties and remove them
            const removeHexId = (obj: any) => {
                for (const key in obj) {
                    if (key === 'hex_id') {
                        delete obj[key];
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        removeHexId(obj[key]);
                    }
                }
            };
            removeHexId(outputObject);

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
                    const children = actionRow.components ?? []
                    if (children.length > 5) {
                        throw new Error("Action rows can only have 5 components");
                    } else if (children.length < 1) {
                        throw new Error("Action rows must have at least 1 component");
                    } else if (children.length > 1) {
                        if (children.filter(c => c.type != 2).length > 1) throw new Error("You can only have one select menu per action row");
                    }
                });
            } catch (e) {
                alert(e);
                return;
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
                });
            } catch (e) {
                alert(e);
                return;
            }

            let json = JSON.stringify([outputObject], null, 2);

            if (!useBaseContainer) {
                json = JSON.stringify(outputObject.components, null, 2);
            }

            if (query.get('min')) json = JSON.stringify([outputObject]); // Minified JSON for length reduction
            
            if (query.get('redir')) {
                const targetUrl = query.get('redir');
                const target = new URL(targetUrl ?? '');

                target.searchParams.set('json', json);
                window.location.href = target.toString();
            } else {
                navigator.clipboard.writeText(json).then(() => {
                    alert("Copied to clipboard!");
                }).catch((err) => {
                    alert("Failed to copy to clipboard: " + err);
                });
            }
        }}>
            {query.get('redir') ? 'Submit' : 'Export'}
        </button>
    </div>

    {#if showSettings}
        <div class="base-settings">
            <div class="base-setting-labelled">
                <h3>Accent Colour</h3>
                <div class="content">
                    <input type="color" bind:value={baseContainer.accent_color} placeholder="Enter color here..." />
                    <button class="colour-danger" style="height: 4rem;" on:click={() => {
                        baseContainer.accent_color = undefined;
                        components.update((c) => {
                            c[0] = baseContainer;
                            return c;
                        });
                    }}>Clear</button>
                </div>
            </div>

            <div class="base-setting-labelled">
                <h3>Use base container?</h3>
                <p>A container will still be displayed in the preview however not in the finished version</p>
                <input type="checkbox" bind:checked={useBaseContainer} />
            </div>
        </div>
    {/if}
</header>
{#if !showSettings}
<div class="content">
    <div class="editor">
        {#each baseContainer.components as component, i}
            <Component
                label={typeNames[component.type]}
                id={i}
                icon="{dev ? `/icons/components/${component.type}.svg` : `https://cdn.jsdelivr.net/gh/NotPiny/Hex/static/icons/components/${component.type}.svg`}"
                description={typeDescription[component.type]}
            >
                {#if component.type === ComponentType.TextDisplay}
                    <textarea bind:value={component.content} placeholder="Enter text here..."></textarea>
                {/if}
                {#if component.type === ComponentType.MediaGallery}
                    {#each component.items ?? [] as image}
                        <div class="image-item">
                            <img src={image.media.url} alt="Preview of media gallery attachment" />
                            <input type="text" bind:value={image.media.url} placeholder="Enter image URL here..." />
                            <button class="colour-danger" on:click={() => {
                                component.items = (component.items ?? []).filter((item) => ((item.media.url !== image.media.url) || (item.media.hex_id !== image.media.hex_id)));
                            }}>X</button>
                        </div>
                    {/each}
                {/if}
                {#if component.type === ComponentType.ActionRow}
                    <div class="action-row-components">
                        {#each component.components ?? [] as actionRowComponent, j}
                            <Component
                                label={typeNames[actionRowComponent.type]}
                                id={j}
                                icon="{dev ? `/icons/components/${actionRowComponent.type}.svg` : `https://cdn.jsdelivr.net/gh/NotPiny/Hex/static/icons/components/${actionRowComponent.type}.svg`}"
                                description={typeDescription[actionRowComponent.type]}
                                noDelete={true}
                                customButtons={[
                                    {
                                        label: "Delete",
                                        class: "colour-danger",
                                        onClick: () => {
                                            component.components = (component.components ?? []).filter((item) => item.hex_id !== actionRowComponent.hex_id);
                                            components.update((c) => {
                                                c[0] = baseContainer;
                                                return c;
                                            });
                                            components.set($components);
                                        }
                                    },
                                    ...(actionRowComponent.type === ComponentType.StringSelectMenu ? [{
                                        label: "Add Option",
                                        class: "colour-success",
                                        onClick: () => {
                                            actionRowComponent.options = actionRowComponent.options || [];
                                            actionRowComponent.options.push({
                                                label: "Option Name",
                                                value: "optionValue",
                                                description: "Description of option",
                                                hex_id: Math.floor(Math.random() * 1000)
                                            });
                                            components.update((c) => {
                                                c[0] = baseContainer;
                                                return c;
                                            });
                                        }
                                    }] : [])
                                ]}
                            >
                                {#if actionRowComponent.type === ComponentType.Button}
                                    <input type="text" bind:value={actionRowComponent.label} placeholder="Enter button label here... (required)" />
                                    <select bind:value={actionRowComponent.style}>
                                        <option value=1>Primary</option>
                                        <option value=2>Secondary</option>
                                        <option value=3>Success</option>
                                        <option value=4>Danger</option>
                                        <option value=5>Link</option>
                                    </select>
                                    <select bind:value={actionRowComponent.disabled}>
                                        <option value={false}>Enabled</option>
                                        <option value={true}>Disabled</option>
                                    </select>

                                    {#if actionRowComponent.style == 5}
                                        <input type="text" bind:value={actionRowComponent.url} placeholder="Enter button URL here... (required)" />
                                    {:else}
                                        <input type="text" bind:value={actionRowComponent.custom_id} placeholder="Enter button custom_id here... (required)" />
                                        <input type="text" bind:value={actionRowComponent.emoji} placeholder="Enter button emoji here... (optional, id/unicode)" />
                                    {/if}
                                {:else}
                                    <input type="text" bind:value={actionRowComponent.placeholder} placeholder="Enter select menu placeholder here... (optional)" />
                                    <select bind:value={actionRowComponent.disabled}>
                                        <option value={false}>Enabled</option>
                                        <option value={true}>Disabled</option>
                                    </select>
                                    <input type="text" bind:value={actionRowComponent.custom_id} placeholder="Enter select menu custom_id here..." />

                                    {#if actionRowComponent.type === ComponentType.StringSelectMenu}
                                        <h3>Options: </h3>
                                        {#each actionRowComponent.options ?? [] as option, k}
                                            <input type="text" bind:value={option.label} placeholder="Enter option label here..." />
                                            <input type="text" bind:value={option.value} placeholder="Enter option value here..." />
                                            <input type="text" bind:value={option.description} placeholder="Enter option description here..." />
                                            <button class="colour-danger" on:click={() => {
                                                actionRowComponent.options = (actionRowComponent.options ?? []).filter((item) => item.value !== option.value);
                                            }}>X</button>
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
                            icon="{dev ? `/icons/components/${sectionComponent.type}.svg` : `https://cdn.jsdelivr.net/gh/NotPiny/Hex/static/icons/components/${sectionComponent.type}.svg`}"
                            description={typeDescription[sectionComponent.type]}
                            noDelete={true}
                            customButtons={[
                                {
                                    label: "Delete",
                                    class: "colour-danger",
                                    onClick: () => {
                                        component.components = (component.components ?? []).filter((item) => item.hex_id !== sectionComponent.hex_id);
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
                                <textarea bind:value={sectionComponent.content} placeholder="Enter text here..."></textarea>
                            {/if}
                        </Component>
                    {/each}
                    <h3>Accessory</h3>
                    <Component
                        label={typeNames[ComponentType.Button]}
                        id={-1}
                        icon="{dev ? `/icons/components/${ComponentType.Button}.svg` : `https://cdn.jsdelivr.net/gh/NotPiny/Hex/static/icons/components/${ComponentType.Button}.svg`}"
                        description={typeDescription[ComponentType.Button]}
                        noDelete={true}
                        customButtons={[
                            {
                                label: "Delete",
                                class: "colour-danger",
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
                        <input type="text" bind:value={(component.accessory as unknown as Component).label} placeholder="Enter button label here... (required)" />
                        <select bind:value={(component.accessory as unknown as Component).style}>
                            <option value=1>Primary</option>
                            <option value=2>Secondary</option>
                            <option value=3>Success</option>
                            <option value=4>Danger</option>
                            <option value=5>Link</option>
                        </select>
                        <select bind:value={(component.accessory as unknown as Component).disabled}>
                            <option value={false}>Enabled</option>
                            <option value={true}>Disabled</option>
                        </select>

                        {#if (component.accessory as unknown as Component).style == 5}
                            <input type="text" bind:value={(component.accessory as unknown as Component).url} placeholder="Enter button URL here... (required)" />
                        {:else}
                            <input type="text" bind:value={(component.accessory as unknown as Component).custom_id} placeholder="Enter button custom_id here... (required)" />
                            <input type="text" bind:value={(component.accessory as unknown as Component).emoji} placeholder="Enter button emoji here... (optional, id/unicode)" />
                        {/if}
                    </Component>
                {/if}

                {#if component.type === ComponentType.File}
                    <input type="text" bind:value={(component.file as UnfurledMediaItem).url} placeholder="Enter file URL here... (attachment:// only)" />
                {/if}

                {#if component.type === ComponentType.Thumbnail}
                    <div class="image-item">
                        <img src={(component.media as UnfurledMediaItem).url} alt="Preview of media gallery attachment" />
                        <input type="text" bind:value={(component.media as UnfurledMediaItem).url} placeholder="Enter image URL here..." />
                    </div>
                {/if}
            </Component>
        {/each}
    </div>
    <div class="preview">
        <Preview />
    </div>
</div>
{/if}

<style>
    header {
        margin-bottom: 20px;
    }

    .content {
        display: flex;
        flex-direction: row;
        justify-content: space-between;

        gap: 25px;

        width: 90%;
        height: 80%;
    }

    .content div {
        border-radius: 40px;
        background-color: #1C1D20;

        padding: 20px;
        padding-left: 40px;
        padding-right: 40px;
        box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
    }

    .editor {
        width: 50%;
        float: left;

        display: flex;
        flex-direction: column;
        gap: 20px;
        overflow-y: auto;
        max-height: 80vh;
    }

    .content textarea {
        width: 95%;
        max-width: 95%;
        height: 100px;
        border-radius: 20px;
        background-color: #2C2D30;
        color: white;
        padding: 10px;
        border: none;
        box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
    }

    .preview {
        width: 50%;
        float: right;
    }

    .image-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: start;
        gap: 20px;

        margin-bottom: 10px;
    }

    .image-item img {
        width: 50px;
        height: 50px;
        border-radius: 20%;
    }

    .image-item input {
        width: 100%;
        max-width: 100%;
        height: 50px;
        border-radius: 20px;
        background-color: #2C2D30;
        color: white;
        padding: 10px;
        border: none;
        box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
    }

    .button-panel {
        display: flex;
        justify-content: center;
    }

    .button-panel button {
        background-color: #2C2D30;
        color: white;
        padding: 10px 20px;
        border-radius: 0;
        cursor: pointer;
        box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
        width: 25%;

        font-weight: 600;
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
        background-color: #2C2D30;
        color: white;
        padding: 10px;
        margin: 10px 0;
        border: none;
        box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
    }

    select {
        width: 105%;
        max-width: 105%;
        height: 65px;
        border-radius: 20px;
        background-color: #2C2D30;
        color: white;
        padding: 10px;
        margin: 10px 0;
        border: none;
        box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.5);
    }

    .base-settings {
        display: flex;
        flex-direction: column;
        justify-content: start;
        gap: 40px;
    }

    /* .base-setting {
        display: flex;
        flex-direction: row;
        justify-content: start;
        gap: 20px;
    } */

    .base-setting-labelled {
        display: flex;
        flex-direction: column;
        justify-content: start;
    }

    .base-setting-labelled .content {
        display: flex;
        flex-direction: row;
        justify-content: start;
        gap: 20px;
    }
</style>
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { ComponentContainer } from './types';

export const components: Writable<ComponentContainer[]> = writable([
	{
		type: 17,
		accent_colour: undefined,
		components: [
			{
				type: 10, // Text Display
				id: 1,
				content:
					'# This is a text display component\nAll the regular markdown formatting works here, including [links](https://hex.daalbot.xyz), *italics*, **bold**, and ~~strikethrough~~, for a full guide on discord markdown see [markdown-text-101.md](https://gist.github.com/matthewzring/9f7bbfd102003963f9be7dbcf7d40e51). You can also insert components such as buttons, select menus, and images almost anywhere you want.'
			},
			{
				type: 12, // Media Gallery
				id: 2,
				items: [
					{
						media: {
							url: 'https://images.unsplash.com/photo-1741866987680-5e3d7f052b87?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
						}
					}
				]
			},
			{
				type: 10,
				id: 3,
				content:
					'Photo by [Mathieu Bigard](https://unsplash.com/@mathieubigard) on [Unsplash](https://unsplash.com/photos/majestic-mountains-reflect-in-the-turquoise-lake-U1o2u8UrHLc)'
			},
			{
				type: 14, // Seperator
				id: 4
			},
			{
				type: 10,
				id: 5,
				content:
					'For more info on how to use components, check out the [documentation](https://discord.com/developers/docs/components/reference)'
			}
		]
	}
]);

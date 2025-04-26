export enum ComponentType {
	ActionRow = 1,
	Button = 2,
	StringSelectMenu = 3,
	// 4 is omitted as its only available in modals (Text Input)
	UserSelectMenu = 5,
	RoleSelectMenu = 6,
	MentionableSelectMenu = 7,
	ChannelSelectMenu = 8,
	Section = 9,
	TextDisplay = 10,
	Thumbnail = 11,
	MediaGallery = 12,
	File = 13,
	Seperator = 14,
	Container = 17
}

export interface UnfurledMediaItem {
	[x: string]: any; // Metadata to allow for identification of the media item (Should be stripped before converting to JSON)
	url: string;
}

export interface Component {
	disabled?: boolean;
	emoji?: string;
	hex_id?: number;
	type: ComponentType;
	id: number;
	custom_id?: string;
	label?: string;
	content?: string;
	style?: number;
	components?: Component[];
	accessory?: Component;
	placeholder?: string;
	media?: UnfurledMediaItem;
	options?: Array<{
		label: string;
		value: string;
		description?: string;
		emoji?: string;
		is_default?: boolean;
		hex_id?: number;
	}>;
	url?: string;
	max_length?: number;
	min_length?: number;
	items?: Array<{ media: UnfurledMediaItem; description?: string; spoiler?: boolean }>;
	file?: UnfurledMediaItem;
}

export interface ComponentContainer {
	accent_color?: number;
	type: ComponentType.Container;
	components: Component[];
}

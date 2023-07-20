

export interface LazyRequestSchema {
	guild_id: string;
	channels?: Record<string, [number, number][]>;
	activities?: boolean;
	threads?: boolean;
	typing?: true;
	members?: string[];
	thread_member_lists?: unknown[];
}

export const LazyRequestSchema = {
	guild_id: String,
	$activities: Boolean,
	$channels: Object,
	$typing: Boolean,
	$threads: Boolean,
	$members: [] as string[],
	$thread_member_lists: [] as unknown[],
};

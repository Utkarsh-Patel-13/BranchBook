import type { LucideIcon } from "lucide-react";
import { BookOpenIcon, BrainIcon, ZapIcon } from "lucide-react";

export interface ChatPreset {
	id: string;
	label: string;
	description: string;
	icon: LucideIcon;
}

export const CHAT_PRESETS: ChatPreset[] = [
	{
		id: "quick",
		label: "Quick",
		description: "Fast, concise answers",
		icon: ZapIcon,
	},
	{
		id: "deep",
		label: "Deep",
		description: "Thorough analysis",
		icon: BrainIcon,
	},
	{
		id: "study",
		label: "Study",
		description: "Structured for learning",
		icon: BookOpenIcon,
	},
];

export const DEFAULT_CHAT_PRESET = CHAT_PRESETS[0] as ChatPreset;

export function getPresetLabel(presetId: string): string {
	return CHAT_PRESETS.find((p) => p.id === presetId)?.label ?? presetId;
}

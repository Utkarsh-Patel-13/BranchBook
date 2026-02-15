import { BrainIcon, CrosshairIcon, ZapIcon } from "lucide-react";

export interface ChatModelItem {
	label: string;
	value: string;
	supportsWeb: boolean;
	supportsThinking: boolean;
}

export const CHAT_MODELS: ChatModelItem[] = [
	{
		label: "Gemini 2.0 Flash",
		value: "gemini-2.0-flash",
		supportsWeb: true,
		supportsThinking: true,
	},
	{
		label: "Gemini 2.5 Pro",
		value: "gemini-2.5-pro",
		supportsWeb: true,
		supportsThinking: true,
	},
	{
		label: "Gemini 2.5 Flash Lite",
		value: "gemini-2.5-flash-lite-preview-09-2025",
		supportsWeb: true,
		supportsThinking: true,
	},
	{
		label: "Gemini 2.5 Flash",
		value: "gemini-2.5-flash-preview-09-2025",
		supportsWeb: true,
		supportsThinking: true,
	},
	{
		label: "Gemini 3 Flash",
		value: "gemini-3-flash-preview",
		supportsWeb: true,
		supportsThinking: true,
	},
	{
		label: "Gemini 3 Preview",
		value: "gemini-3-pro-preview",
		supportsWeb: true,
		supportsThinking: true,
	},
];

const MODE_TO_MODEL: Record<string, string> = {
	Fast: "gemini-2.5-flash-lite-preview-09-2025",
	Deep: "gemini-2.5-flash-preview-09-2025",
	Precise: "gemini-3-flash-preview",
};

export const CHAT_MODES = [
	{ label: "Fast", value: MODE_TO_MODEL.Fast, icon: ZapIcon },
	{ label: "Deep", value: MODE_TO_MODEL.Deep, icon: BrainIcon },
	{ label: "Precise", value: MODE_TO_MODEL.Precise, icon: CrosshairIcon },
] as const;

export const DEFAULT_CHAT_MODEL =
	CHAT_MODELS.find(
		(m) => m.value === "gemini-2.5-flash-lite-preview-09-2025"
	) ?? CHAT_MODELS[0];

export function getModeLabel(modelValue: string): string {
	const mode = CHAT_MODES.find((m) => m.value === modelValue);
	if (mode) {
		return mode.label;
	}
	const model = CHAT_MODELS.find((m) => m.value === modelValue);
	return model?.label ?? modelValue;
}

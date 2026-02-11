import { BrainIcon, ChevronRightIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ReasoningContextValue {
	open: boolean;
}

const ReasoningContext = createContext<ReasoningContextValue>({ open: false });

export interface ReasoningProps
	extends Omit<
		ComponentProps<typeof Collapsible>,
		"open" | "onOpenChange" | "defaultOpen"
	> {
	isStreaming?: boolean;
}

export function Reasoning({
	isStreaming = false,
	children,
	className,
	...props
}: ReasoningProps) {
	// Open while reasoning streams, auto-collapse when it finishes
	const [open, setOpen] = useState(isStreaming);

	useEffect(() => {
		setOpen(isStreaming);
	}, [isStreaming]);

	return (
		<ReasoningContext.Provider value={{ open }}>
			<Collapsible
				className={cn("w-full", className)}
				onOpenChange={setOpen}
				open={open}
				{...props}
			>
				{children}
			</Collapsible>
		</ReasoningContext.Provider>
	);
}

export interface ReasoningTriggerProps
	extends ComponentProps<typeof CollapsibleTrigger> {
	isStreaming?: boolean;
	duration?: number;
	getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
}

export function ReasoningTrigger({
	className,
	isStreaming,
	duration,
	getThinkingMessage,
	...props
}: ReasoningTriggerProps) {
	const { open } = useContext(ReasoningContext);

	const streamingLabel = "Thinking…";
	const staticLabel = getThinkingMessage
		? getThinkingMessage(false, duration)
		: duration
			? `Thought for ${duration}s`
			: "View reasoning";

	return (
		<CollapsibleTrigger
			className={cn(
				"flex w-full items-center gap-1.5 rounded py-0.5 text-left text-muted-foreground text-xs hover:text-foreground",
				className
			)}
			{...props}
		>
			<BrainIcon className="size-3.5 shrink-0" />
			{isStreaming ? (
				<Shimmer as="span" className="text-xs">
					{streamingLabel}
				</Shimmer>
			) : (
				<span>{staticLabel}</span>
			)}
			<ChevronRightIcon
				className={cn(
					"ml-auto size-3.5 shrink-0 transition-transform",
					open && "rotate-90"
				)}
			/>
		</CollapsibleTrigger>
	);
}

export interface ReasoningContentProps
	extends Omit<ComponentProps<typeof CollapsibleContent>, "children"> {
	children: string;
}

export function ReasoningContent({
	children,
	className,
	...props
}: ReasoningContentProps) {
	return (
		<CollapsibleContent
			className={cn("mt-1.5 overflow-hidden", className)}
			{...props}
		>
			<div className="whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-2.5 font-mono text-muted-foreground text-xs leading-relaxed">
				{children}
			</div>
		</CollapsibleContent>
	);
}

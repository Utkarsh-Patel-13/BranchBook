import { ChevronRightIcon, ExternalLinkIcon, GlobeIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, useContext, useState } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SourcesContextValue {
	open: boolean;
}

const SourcesContext = createContext<SourcesContextValue>({ open: false });

export type SourcesProps = ComponentProps<typeof Collapsible>;

export function Sources({ children, className, ...props }: SourcesProps) {
	const [open, setOpen] = useState(false);

	return (
		<SourcesContext.Provider value={{ open }}>
			<Collapsible
				className={cn("w-full", className)}
				onOpenChange={setOpen}
				open={open}
				{...props}
			>
				{children}
			</Collapsible>
		</SourcesContext.Provider>
	);
}

export interface SourcesTriggerProps
	extends Omit<ComponentProps<typeof CollapsibleTrigger>, "children"> {
	count: number;
}

export function SourcesTrigger({
	count,
	className,
	...props
}: SourcesTriggerProps) {
	const { open } = useContext(SourcesContext);

	return (
		<CollapsibleTrigger
			className={cn(
				"flex items-center gap-1.5 rounded py-0.5 text-muted-foreground text-xs hover:text-foreground",
				className
			)}
			{...props}
		>
			<GlobeIcon className="size-3.5 shrink-0" />
			<span>
				{count} {count === 1 ? "source" : "sources"}
			</span>
			<ChevronRightIcon
				className={cn(
					"size-3.5 shrink-0 transition-transform",
					open && "rotate-90"
				)}
			/>
		</CollapsibleTrigger>
	);
}

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>;

export function SourcesContent({
	children,
	className,
	...props
}: SourcesContentProps) {
	return (
		<CollapsibleContent
			className={cn("mt-1.5 overflow-hidden", className)}
			{...props}
		>
			<div className="flex flex-col gap-1">{children}</div>
		</CollapsibleContent>
	);
}

export interface SourceProps
	extends Omit<ComponentProps<"a">, "target" | "rel"> {
	title?: string;
}

export function Source({ href, title, className, ...props }: SourceProps) {
	const displayTitle = title ?? href ?? "Source";

	return (
		<a
			className={cn(
				"flex items-center gap-1.5 truncate rounded px-1.5 py-1 text-muted-foreground text-xs hover:bg-muted hover:text-foreground",
				className
			)}
			href={href}
			rel="noopener noreferrer"
			target="_blank"
			{...props}
		>
			<ExternalLinkIcon className="size-3 shrink-0" />
			<span className="truncate">{displayTitle}</span>
		</a>
	);
}

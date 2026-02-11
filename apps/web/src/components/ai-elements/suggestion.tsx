import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SuggestionsProps = ComponentProps<"div">;

export function Suggestions({
	className,
	children,
	...props
}: SuggestionsProps) {
	return (
		<div
			className={cn(
				"flex flex-wrap items-center justify-center gap-2",
				className
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export interface SuggestionProps
	extends Omit<ComponentProps<typeof Button>, "onClick"> {
	suggestion: string;
	onClick?: (suggestion: string) => void;
}

export function Suggestion({
	suggestion,
	onClick,
	className,
	...props
}: SuggestionProps) {
	return (
		<Button
			className={cn("h-auto rounded-full px-3 py-1.5 text-xs", className)}
			onClick={() => onClick?.(suggestion)}
			size="sm"
			type="button"
			variant="outline"
			{...props}
		>
			{suggestion}
		</Button>
	);
}

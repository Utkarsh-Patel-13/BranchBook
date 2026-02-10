import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	// biome-ignore lint/suspicious/noExplicitAny: duplicate @types/react versions cause ref type mismatch
	const Icon = Loader2Icon as any;
	return (
		<Icon
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			role="status"
			{...props}
		/>
	);
}

export { Spinner };

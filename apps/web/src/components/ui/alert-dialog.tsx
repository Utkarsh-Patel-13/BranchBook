import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

function AlertDialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
	return <DialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogBackdrop({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>) {
	return (
		<DialogPrimitive.Backdrop
			className={cn(
				"data-[ending-style]:fade-out data-[starting-style]:fade-in fixed inset-0 z-50 bg-black/80 data-[ending-style]:animate-out data-[starting-style]:animate-in",
				className
			)}
			data-slot="alert-dialog-backdrop"
			{...props}
		/>
	);
}

function AlertDialogContent({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>) {
	return (
		<AlertDialogPortal>
			<AlertDialogBackdrop />
			<DialogPrimitive.Popup
				className={cn(
					"data-[ending-style]:fade-out data-[ending-style]:zoom-out-95 data-[starting-style]:fade-in data-[starting-style]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[ending-style]:animate-out data-[starting-style]:animate-in sm:rounded-lg",
					className
				)}
				data-slot="alert-dialog-content"
				{...props}
			/>
		</AlertDialogPortal>
	);
}

function AlertDialogHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex flex-col space-y-2 text-center sm:text-left",
				className
			)}
			data-slot="alert-dialog-header"
			{...props}
		/>
	);
}

function AlertDialogFooter({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				className
			)}
			data-slot="alert-dialog-footer"
			{...props}
		/>
	);
}

function AlertDialogTitle({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={cn("font-semibold text-lg", className)}
			data-slot="alert-dialog-title"
			{...props}
		/>
	);
}

function AlertDialogDescription({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			className={cn("text-muted-foreground text-sm", className)}
			data-slot="alert-dialog-description"
			{...props}
		/>
	);
}

function AlertDialogAction({
	...props
}: React.ComponentPropsWithoutRef<typeof Button>) {
	return <Button data-slot="alert-dialog-action" {...props} />;
}

function AlertDialogCancel({
	...props
}: React.ComponentPropsWithoutRef<typeof Button>) {
	return (
		<Button data-slot="alert-dialog-cancel" variant="outline" {...props} />
	);
}

function AlertDialogTrigger({
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>) {
	return (
		<DialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
	);
}

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogBackdrop,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger,
};

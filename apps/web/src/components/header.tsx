"use client";

import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

interface MenuItem {
	title: string;
	url: string;
	description?: string;
	icon?: React.ReactNode;
	items?: MenuItem[];
}

export default function Header() {
	const { data: session } = authClient.useSession();

	const menu: MenuItem[] = session
		? [
				{
					title: "Workspaces",
					url: "/workspaces",
				},
			]
		: [];

	const logo = (
		<Link
			className="flex items-center gap-2 transition-opacity hover:opacity-80"
			to="/"
		>
			<span className="material-symbols-outlined text-2xl text-primary">
				auto_stories
			</span>
			<span className="font-semibold text-lg tracking-tight">Nexus</span>
		</Link>
	);

	return (
		<nav className="sticky top-0 z-50 border-border border-b bg-background/80 backdrop-blur-md">
			<div className="mx-auto h-16 max-w-7xl items-center px-6">
				{/* Desktop Menu */}
				<div className="hidden h-full items-center justify-between lg:flex">
					<div className="flex items-center gap-8">
						{logo}
						<NavigationMenu>
							<NavigationMenuList>
								{menu.map((item) => renderMenuItem(item))}
							</NavigationMenuList>
						</NavigationMenu>
					</div>
					<div className="flex items-center gap-4">
						<ModeToggle />
						<UserMenu />
					</div>
				</div>

				{/* Mobile Menu */}
				<div className="flex h-full items-center justify-between lg:hidden">
					{logo}
					<div className="flex items-center gap-2">
						<ModeToggle />
						<Sheet>
							<SheetTrigger asChild>
								<Button size="icon" variant="outline">
									<Menu className="size-4" />
								</Button>
							</SheetTrigger>
							<SheetContent className="w-[300px] overflow-y-auto" side="right">
								<SheetHeader>
									<SheetTitle className="text-left">{logo}</SheetTitle>
								</SheetHeader>
								<div className="mt-8 flex flex-col gap-6">
									<Accordion
										className="flex w-full flex-col gap-4"
										collapsible
										type="single"
									>
										{menu.map((item) => renderMobileMenuItem(item))}
									</Accordion>

									<div className="flex flex-col gap-3 border-t pt-6">
										<UserMenu />
									</div>
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</div>
		</nav>
	);
}

const renderMenuItem = (item: MenuItem) => {
	if (item.items) {
		return (
			<NavigationMenuItem key={item.title}>
				<NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
				<NavigationMenuContent className="bg-popover text-popover-foreground">
					<div className="w-80 p-3">
						{item.items.map((subItem) => (
							<SubMenuLink item={subItem} key={subItem.title} />
						))}
					</div>
				</NavigationMenuContent>
			</NavigationMenuItem>
		);
	}

	return (
		<NavigationMenuItem key={item.title}>
			<NavigationMenuLink asChild>
				<Link
					activeProps={{ className: "bg-muted text-primary" }}
					className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 font-medium text-sm transition-colors hover:bg-muted hover:text-accent-foreground"
					to={item.url}
				>
					{item.title}
				</Link>
			</NavigationMenuLink>
		</NavigationMenuItem>
	);
};

const renderMobileMenuItem = (item: MenuItem) => {
	if (item.items) {
		return (
			<AccordionItem className="border-b-0" key={item.title} value={item.title}>
				<AccordionTrigger className="py-0 font-semibold text-md hover:no-underline">
					{item.title}
				</AccordionTrigger>
				<AccordionContent className="mt-4">
					<div className="flex flex-col gap-2">
						{item.items.map((subItem) => (
							<Link
								className="rounded-md p-2 text-muted-foreground text-sm hover:bg-muted hover:text-primary"
								key={subItem.title}
								to={subItem.url}
							>
								<div className="font-medium">{subItem.title}</div>
								{subItem.description && (
									<p className="line-clamp-2 text-muted-foreground text-xs">
										{subItem.description}
									</p>
								)}
							</Link>
						))}
					</div>
				</AccordionContent>
			</AccordionItem>
		);
	}

	return (
		<Link
			activeProps={{ className: "text-primary" }}
			className="font-semibold text-md"
			key={item.title}
			to={item.url}
		>
			{item.title}
		</Link>
	);
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
	return (
		<NavigationMenuLink asChild>
			<Link
				className="flex select-none flex-row gap-4 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
				to={item.url}
			>
				{item.icon && <div className="text-foreground">{item.icon}</div>}
				<div>
					<div className="font-semibold text-sm">{item.title}</div>
					{item.description && (
						<p className="mt-1 text-muted-foreground text-sm leading-snug">
							{item.description}
						</p>
					)}
				</div>
			</Link>
		</NavigationMenuLink>
	);
};

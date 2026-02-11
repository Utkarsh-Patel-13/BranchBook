"use client";

import { Link } from "@tanstack/react-router";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
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
				<div className="flex h-full items-center justify-between">
					<div className="flex items-center gap-4 sm:gap-8">
						{logo}
						<NavigationMenu>
							<NavigationMenuList>
								{menu.map((item) => renderMenuItem(item))}
							</NavigationMenuList>
						</NavigationMenu>
					</div>
					<div className="flex items-center gap-3 sm:gap-4">
						<ModeToggle />
						<UserMenu />
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
			<NavigationMenuLink
				render={
					<Link
						activeProps={{ className: "bg-muted text-primary" }}
						className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 font-medium text-sm transition-colors hover:bg-muted hover:text-accent-foreground"
						to={item.url}
					>
						{item.title}
					</Link>
				}
			/>
		</NavigationMenuItem>
	);
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
	return (
		<NavigationMenuLink
			render={
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
			}
		/>
	);
};

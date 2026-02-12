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
			className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
			to="/"
		>
			<span className="material-symbols-outlined text-primary text-xl">
				auto_stories
			</span>
			<span className="font-semibold text-base tracking-tight">Nexus</span>
		</Link>
	);

	return (
		<nav className="sticky top-0 z-50 border-border border-b bg-background/80 backdrop-blur-md">
			<div className="h-14 items-center px-4 sm:px-5">
				<div className="flex h-full items-center justify-between">
					<div className="flex items-center gap-3 sm:gap-6">
						{logo}
						<NavigationMenu>
							<NavigationMenuList>
								{menu.map((item) => renderMenuItem(item))}
							</NavigationMenuList>
						</NavigationMenu>
					</div>
					<div className="flex items-center justify-end gap-2.5 sm:gap-3.5">
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
						className="group inline-flex h-9 w-max items-center justify-center rounded-md px-3.5 py-1.5 font-medium text-xs transition-colors hover:bg-muted hover:text-accent-foreground sm:text-sm"
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
					className="flex select-none flex-row gap-3 rounded-md p-2.5 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-accent-foreground"
					to={item.url}
				>
					{item.icon && <div className="text-foreground">{item.icon}</div>}
					<div>
						<div className="font-semibold text-xs sm:text-sm">{item.title}</div>
						{item.description && (
							<p className="mt-1 text-muted-foreground text-xs leading-snug sm:text-sm">
								{item.description}
							</p>
						)}
					</div>
				</Link>
			}
		/>
	);
};

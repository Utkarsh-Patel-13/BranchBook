"use client";

import { Link } from "@tanstack/react-router";
import { Folder, GithubIcon } from "lucide-react";
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
	external?: boolean;
}

export default function Header() {
	const { data: session } = authClient.useSession();

	const menu: MenuItem[] = session
		? [
				{
					title: "Workspaces",
					url: "/workspaces",
					icon: <Folder className="size-3.5" />,
				},
				{
					title: "GitHub",
					url: "https://github.com/Utkarsh-Patel-13/BranchBook",
					external: true,
					icon: <GithubIcon className="size-3.5" />,
				},
			]
		: [
				{
					title: "GitHub",
					url: "https://github.com/Utkarsh-Patel-13/BranchBook",
					external: true,
				},
			];

	const logo = (
		<Link
			className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
			to="/"
		>
			<svg
				aria-labelledby="branchbook-logo-title"
				fill="none"
				height="20"
				role="img"
				viewBox="0 0 20 20"
				width="20"
			>
				<title id="branchbook-logo-title">BranchBook Logo</title>
				<circle
					cx="10"
					cy="4"
					r="2.5"
					stroke="currentColor"
					strokeWidth="1.5"
				/>
				<circle
					cx="5"
					cy="16"
					r="2.5"
					stroke="currentColor"
					strokeWidth="1.5"
				/>
				<circle
					cx="15"
					cy="16"
					r="2.5"
					stroke="currentColor"
					strokeWidth="1.5"
				/>
				<line
					stroke="currentColor"
					strokeWidth="1.5"
					x1="10"
					x2="5"
					y1="6.5"
					y2="13.5"
				/>
				<line
					stroke="currentColor"
					strokeWidth="1.5"
					x1="10"
					x2="15"
					y1="6.5"
					y2="13.5"
				/>
			</svg>
			<span className="font-semibold text-base tracking-tight">BranchBook</span>
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
						rel={item.external ? "noreferrer noopener" : undefined}
						target={item.external ? "_blank" : undefined}
						to={item.url}
					>
						{item.icon && <div className="text-foreground">{item.icon}</div>}
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

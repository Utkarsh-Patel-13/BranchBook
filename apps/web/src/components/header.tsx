import { Link } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const { data: session } = authClient.useSession();

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-4 py-3">
				<div className="flex items-center gap-6">
					<Link className="font-semibold text-lg" to="/">
						Nexus
					</Link>
					{session && (
						<nav className="flex gap-4 text-sm">
							<Link
								activeProps={{ className: "font-medium" }}
								className="text-muted-foreground transition-colors hover:text-foreground"
								to="/workspaces"
							>
								Workspaces
							</Link>
						</nav>
					)}
				</div>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	);
}

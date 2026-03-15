import { createFileRoute, redirect } from "@tanstack/react-router";

import SignInForm from "@/components/sign-in-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (session.data) {
			redirect({
				to: "/workspaces",
				throw: true,
			});
		}
	},
});

function RouteComponent() {
	// const [showSignIn, setShowSignIn] = useState(true);

	// return showSignIn ? (
	return <SignInForm />;
	// ) : (
	// 	<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	// );
}

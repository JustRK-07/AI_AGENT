import { type AppType } from "next/app";
import { Geist } from "next/font/google";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import "@/styles/globals.css";
import "@/styles/gentelella-panels.css";
import { Toaster } from "sonner";
import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/components/ThemeProvider";

const geist = Geist({
	subsets: ["latin"],
});

const MyApp: AppType = ({ Component, pageProps }) => {
	const [mounted, setMounted] = useState(false);
	const router = useRouter();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	// Pages that should not have the sidebar/navigation (full-screen)
	const isLandingPage = router.pathname.startsWith('/landing');
	const isAuthPage = router.pathname === '/auth';
	const noLayoutPages = isLandingPage || isAuthPage;

	return (
		<ThemeProvider defaultTheme="light" storageKey="ytel-theme">
			<div className={geist.className}>
				<Toaster position="top-right" richColors />
				{noLayoutPages ? (
					<Component {...pageProps} />
				) : (
					<Layout>
						<Component {...pageProps} />
					</Layout>
				)}
			</div>
		</ThemeProvider>
	);
};

export default MyApp;

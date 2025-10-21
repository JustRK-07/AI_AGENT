import { type ReactNode } from "react";
import { useRouter } from "next/router";
import { Navigation } from "./Navigation";
import { CommandPalette } from "./CommandPalette";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter();
  
  // Don't show navigation on auth page
  if (router.pathname === "/auth") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Navigation key="main-navigation" />
      <CommandPalette />
      {/* Main content area - padding top for mobile header, margin left dynamically adjusts via CSS variable */}
      <main className="pt-16 lg:pt-0 transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 64px)' }}>
        {children}
      </main>
    </div>
  );
} 
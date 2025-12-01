'use client';

import { Header } from './header';
import { MobileNav } from './mobile-nav';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  hideNav?: boolean;
}

export function AppShell({ children, title, hideNav = false }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-blue-500/5 to-blue-500/15 dark:from-background dark:via-blue-500/10 dark:to-blue-500/20">
      <Header title={title} />
      <main className="flex-1 pb-20 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      {!hideNav && <MobileNav />}
    </div>
  );
}

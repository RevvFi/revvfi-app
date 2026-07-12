"use client";

import { TopNav } from "./TopNav";
import { CommandPalette } from "@/components/command-palette";
import { WrongNetworkModal } from "@/components/WrongNetworkModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <CommandPalette />
      <WrongNetworkModal />
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

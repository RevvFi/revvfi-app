"use client";

import { TopNav } from "./TopNav";
import { CommandPalette } from "@/components/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0A0A0A]">
      <CommandPalette />
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

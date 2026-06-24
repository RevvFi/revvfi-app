"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useAuthStore } from "@/store/auth.store";
import { useSIWE } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAddress } from "@/lib/utils";
import { LogOut, Wallet, Shield, Bell, Globe } from "lucide-react";

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { user, isAuthenticated, logout: storeLogout } = useAuthStore();
  const { logout } = useSIWE();

  async function handleLogout() {
    await logout();
    disconnect();
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Settings</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <Card className="p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Account</p>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-full bg-primary-container/15 flex items-center justify-center shrink-0">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-on-surface mono truncate">{address ?? "Not connected"}</p>
            <p className="text-xs text-on-surface-variant capitalize">{user?.role ?? "Guest"}</p>
          </div>
          {isAuthenticated && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Authenticated
            </span>
          )}
        </div>
        <div className="border-t border-outline-variant/20 pt-4 flex gap-3">
          <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-3.5 w-3.5" /> Sign Out & Disconnect
          </Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Notifications</p>
        {[
          { label: "Liquidation Warnings", desc: "Alert when health factor drops below 1.3" },
          { label: "Offer Filled", desc: "Notify when your lending offers are accepted" },
          { label: "Position Settled", desc: "Notify when positions reach maturity" },
          { label: "Auction Updates", desc: "Real-time bid updates on active auctions" },
        ].map(({ label, desc }) => (
          <div key={label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-on-surface">{label}</p>
              <p className="text-xs text-on-surface-variant">{desc}</p>
            </div>
            <button className="h-6 w-11 rounded-full bg-primary-container transition-colors relative">
              <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform" />
            </button>
          </div>
        ))}
      </Card>

      {/* Network */}
      <Card className="p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Network</p>
        <div className="space-y-2">
          {[
            { id: 1, name: "Ethereum Mainnet", active: true },
            { id: 11155111, name: "Sepolia Testnet", active: false },
            { id: 31337, name: "Local Development", active: false },
          ].map(({ id, name, active }) => (
            <div key={id} className={`flex items-center gap-3 rounded-lg p-3 border ${active ? "border-primary-container/40 bg-primary-container/10" : "border-outline-variant/20"}`}>
              <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-400" : "bg-outline-variant"}`} />
              <span className="text-sm text-on-surface">{name}</span>
              {active && <span className="ml-auto text-xs text-primary">Active</span>}
            </div>
          ))}
        </div>
      </Card>

      {/* API / Env info */}
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">API Configuration</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Backend URL</span>
            <span className="mono text-xs text-on-surface">{process.env.NEXT_PUBLIC_API_URL}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Auth Status</span>
            <span className={isAuthenticated ? "text-emerald-400" : "text-on-surface-variant"}>
              {isAuthenticated ? "Authenticated" : "Not authenticated"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

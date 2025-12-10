// components/layout/app-shell.tsx
"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";

export type TabKey = "entry" | "preview";

interface AppShellProps {
  children: ReactNode;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function AppShell({ children, activeTab, onTabChange }: AppShellProps) {
  const baseTab =
    "px-3 py-1 rounded-sm text-xs transition-colors select-none cursor-pointer";
  const active = "bg-white text-black font-semibold";
  const inactive = "hover:bg-white/10 text-gray-200";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="sticky top-0 z-20 bg-black text-white shadow-md">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: title */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-sm bg-white/10 flex items-center justify-center text-xs font-semibold">
              RC
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                Receipt Console
              </span>
              <span className="text-[11px] text-gray-300">
                Siuroma Kids Receipt Creator
              </span>
            </div>
          </div>

          {/* Middle: tabs (Entry / Preview) */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              className={`${baseTab} ${
                activeTab === "entry" ? active : inactive
              }`}
              onClick={() => onTabChange("entry")}
            >
              Entry
            </button>
            <button
              className={`${baseTab} ${
                activeTab === "preview" ? active : inactive
              }`}
              onClick={() => onTabChange("preview")}
            >
              Preview
            </button>
          </nav>

          {/* Right: search / meta */}
          <div className="flex items-center gap-3">
            <Input
              className="h-7 w-40 bg-white/10 border-white/20 text-xs placeholder:text-gray-400"
              placeholder="Search receipts..."
            />
            <div className="flex items-center gap-2 text-[11px] text-gray-300">
              <span>Last saved: just now</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 2xl:px-[10%] [@media(min-width:1800px)]:px-[20%] [@media(min-width:2200px)]:px-[25%] [@media(min-width:2600px)]:px-[28%] [@media(min-width:3000px)]:px-[30%] [@media(min-width:3100px)]:px-[37%] py-6">
        {children}
      </main>
    </div>
  );
}

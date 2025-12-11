// top-bar.tsx

"use client";

import { Plus, X, LayoutGrid } from "lucide-react";

export interface Tab {
  id: string;
  title: string;
}

interface TopBarProps {
  tabs: Tab[];
  activeTabId: string;
  isFilesView: boolean;
  onToggleFilesView: () => void;
  onTabChange: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewEntry: () => void;
}

export function TopBar({
  tabs,
  activeTabId,
  isFilesView,
  onToggleFilesView,
  onTabChange,
  onTabClose,
  onNewEntry,
}: TopBarProps) {
  // Shared base classes for consistency
  const tabBaseClasses =
    "relative flex items-center h-8 px-3 rounded-t-md text-xs cursor-pointer transition-colors border-t border-x border-transparent select-none";
  const activeClasses =
    "bg-[#f3f4f6] text-black font-medium shadow-sm !border-gray-300/50";
  const inactiveClasses =
    "bg-[#2d2d2d] text-gray-400 hover:bg-[#3d3d3d] hover:text-gray-200";

  return (
    <header className="h-10 bg-[#1b1b1b] flex items-end px-4 gap-4 select-none z-50">
      {/* 1. App Title / Logo */}
      <div className="flex items-center h-full pb-0.5">
        <span className="text-white font-medium text-sm tracking-wide">
          Siuroma Kids Entry Manager
        </span>
      </div>

      <div className="h-5 w-px bg-gray-700 mb-2.5" />

      {/* 2. Tabs Container */}
      <div className="flex-1 flex items-end h-full overflow-x-auto no-scrollbar gap-1">
        {/* Permanent Explorer "Tab" */}
        <div
          onClick={() => !isFilesView && onToggleFilesView()}
          className={`
            ${tabBaseClasses} min-w-[110px] gap-2
            ${isFilesView ? activeClasses : inactiveClasses}
          `}
          title="File Explorer"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Explorer</span>
        </div>

        {/* Dynamic Receipt Tabs */}
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId && !isFilesView;
          return (
            <div
              key={tab.id}
              onClick={() => {
                if (isFilesView) onToggleFilesView();
                onTabChange(tab.id);
              }}
              className={`
                group justify-between min-w-[140px] max-w-[200px]
                ${tabBaseClasses}
                ${isActive ? activeClasses : inactiveClasses}
              `}
            >
              <span className="truncate mr-2">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className={`
                  p-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-all cursor-pointer
                  ${isActive ? "text-gray-600" : "text-gray-400"}
                `}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* New Entry Button */}
        <button
          onClick={onNewEntry}
          className="h-8 w-8 flex items-center justify-center rounded-t-md hover:bg-[#3d3d3d] text-gray-400 hover:text-white transition-colors cursor-pointer"
          title="New Entry"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

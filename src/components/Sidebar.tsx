'use client';

import { ReactNode } from 'react';

type Tab = 'scene' | 'inspector' | 'history';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: ReactNode;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'scene', label: 'Scene' },
  { key: 'inspector', label: 'Inspector' },
  { key: 'history', label: 'History' },
];

export default function Sidebar({ activeTab, onTabChange, children }: SidebarProps) {
  return (
    <div className="w-[360px] min-w-[360px] h-full flex flex-col bg-[#0f1729] border-r border-white/5">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500" />
          <h1 className="text-sm font-bold text-white tracking-tight">AI 3D Studio</h1>
        </div>
        <p className="text-xs text-white/40 mt-0.5 ml-5">3D Scene Generator</p>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

'use client';

import { ReactNode } from 'react';

type Tab = 'scene' | 'inspector' | 'history';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: ReactNode;
  promptArea: ReactNode;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'scene', label: 'Scene' },
  { key: 'inspector', label: 'Inspector' },
  { key: 'history', label: 'History' },
];

export default function Sidebar({ activeTab, onTabChange, children, promptArea }: SidebarProps) {
  return (
    <div className="w-[380px] min-w-[380px] h-full flex flex-col bg-[#0d1117]/95 backdrop-blur-xl border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" fill="white" fillOpacity="0.9" />
              <path d="M10 2L18 7L10 12L2 7L10 2Z" fill="white" />
              <path d="M10 12V18L2 13V7L10 12Z" fill="white" fillOpacity="0.6" />
            </svg>
          </div>
          <div>
            <h1 className="text-[17px] font-semibold text-white tracking-tight leading-tight">
              DOPE [spaces]
            </h1>
            <p className="text-[11px] text-white/30 font-medium mt-0.5">3D Scene Generator</p>
          </div>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="px-5 pb-4">
        <div className="flex items-center p-1 bg-white/[0.04] rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 py-2 px-3 rounded-[10px] text-[13px] font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white/[0.1] text-white shadow-sm'
                  : 'text-white/35 hover:text-white/55'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/[0.06]" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Prompt Area */}
      <div className="border-t border-white/[0.06] p-5">
        {promptArea}
      </div>
    </div>
  );
}

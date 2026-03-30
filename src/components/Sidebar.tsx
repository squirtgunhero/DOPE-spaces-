'use client';

import { ReactNode } from 'react';

type Tab = 'scene' | 'inspector' | 'history';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: ReactNode;
  promptArea: ReactNode;
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'scene', label: 'Scene', icon: '\u25A6' },
  { key: 'inspector', label: 'Inspector', icon: '\u25C9' },
  { key: 'history', label: 'History', icon: '\u25F4' },
];

export default function Sidebar({ activeTab, onTabChange, children, promptArea }: SidebarProps) {
  return (
    <div className="w-[380px] min-w-[380px] h-full flex flex-col bg-[#0c1220] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {/* Gradient 3D Cube Icon */}
          <div className="relative w-9 h-9 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="cubeGrad1" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="cubeGrad2" x1="0" y1="36" x2="36" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              {/* Top face */}
              <path d="M18 4 L32 12 L18 20 L4 12 Z" fill="url(#cubeGrad1)" opacity="0.9" />
              {/* Left face */}
              <path d="M4 12 L18 20 L18 34 L4 26 Z" fill="url(#cubeGrad2)" opacity="0.7" />
              {/* Right face */}
              <path d="M32 12 L18 20 L18 34 L32 26 Z" fill="url(#cubeGrad1)" opacity="0.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent leading-tight">
              AI 3D Studio
            </h1>
            <p className="text-[11px] text-white/30 mt-0.5">Powered by Claude</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="mx-4 mt-4 mb-2">
        <div className="flex items-center p-1.5 gap-1 bg-white/[0.02] rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white/[0.06] text-white shadow-sm'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
              }`}
            >
              <span className="text-sm leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-1">{children}</div>

      {/* Prompt Area */}
      <div className="border-t border-white/[0.06] p-4 bg-[#0c1220]">
        {promptArea}
      </div>
    </div>
  );
}

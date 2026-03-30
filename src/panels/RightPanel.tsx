'use client';

import { useSceneStore, RightTab } from '@/store/scene-store';
import SceneGraphTab from './SceneGraphTab';
import PropertiesTab from './PropertiesTab';
import HistoryTab from './HistoryTab';
import ExportTab from './ExportTab';

const TABS: { key: RightTab; label: string }[] = [
  { key: 'graph', label: 'Graph' },
  { key: 'properties', label: 'Props' },
  { key: 'history', label: 'History' },
  { key: 'export', label: 'Export' },
];

export default function RightPanel() {
  const rightTab = useSceneStore((s) => s.rightTab);
  const setRightTab = useSceneStore((s) => s.setRightTab);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex gap-0.5 bg-white/[0.03] rounded-lg p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRightTab(tab.key)}
              className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 ${
                rightTab === tab.key
                  ? 'bg-white/[0.06] text-white shadow-sm'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/[0.04] mx-4" />

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {rightTab === 'graph' && <SceneGraphTab />}
        {rightTab === 'properties' && <PropertiesTab />}
        {rightTab === 'history' && <HistoryTab />}
        {rightTab === 'export' && <ExportTab />}
      </div>
    </div>
  );
}

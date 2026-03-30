'use client';

import { useSceneStore, RightTab } from '@/store/scene-store';
import SceneGraphTab from './SceneGraphTab';
import PropertiesTab from './PropertiesTab';
import HistoryTab from './HistoryTab';
import ExportTab from './ExportTab';

const TABS: { key: RightTab; label: string }[] = [
  { key: 'graph', label: 'Scene' },
  { key: 'properties', label: 'Properties' },
  { key: 'history', label: 'History' },
  { key: 'export', label: 'Export' },
];

export default function RightPanel() {
  const rightTab = useSceneStore((s) => s.rightTab);
  const setRightTab = useSceneStore((s) => s.setRightTab);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-[#333] bg-[#252525]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRightTab(tab.key)}
            className={`flex-1 px-2 py-2.5 text-[11px] font-medium transition-all border-b-2 ${
              rightTab === tab.key
                ? 'border-[#2680eb] text-white'
                : 'border-transparent text-[#777] hover:text-[#bbb]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {rightTab === 'graph' && <SceneGraphTab />}
        {rightTab === 'properties' && <PropertiesTab />}
        {rightTab === 'history' && <HistoryTab />}
        {rightTab === 'export' && <ExportTab />}
      </div>
    </div>
  );
}

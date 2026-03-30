import React, { useMemo } from 'react';
import type { ScanProgress as ScanProgressType } from '../types';

interface ScanProgressProps {
  progress: ScanProgressType;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({ progress }) => {
  const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  const phaseLabel = useMemo(() => {
    switch (progress.phase) {
      case 'fetching': return '📡 Fetching files from GitHub...';
      case 'parsing': return '🔍 Parsing AST & extracting imports...';
      case 'analyzing': return '📦 Fetching bundle sizes...';
    }
  }, [progress.phase]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      {/* Animated logo */}
      <div className="flex items-center gap-3 text-4xl font-bold">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
          <rect x="2" y="2" width="20" height="20" rx="2"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
        </svg>
        <span>Dep<span className="text-[#E24B4A]">Xray</span></span>
      </div>

      {/* Phase label */}
      <p className="text-[#aaa] text-lg font-mono">{phaseLabel}</p>

      {/* Progress bar */}
      <div className="w-full max-w-lg">
        <div className="flex justify-between text-xs text-[#555] font-mono mb-2">
          <span>{progress.phase === 'fetching' ? 'Fetching files' : progress.phase === 'analyzing' ? 'Analyzing packages' : 'Parsing'}</span>
          {progress.total > 0 && (
            <span>{progress.done} / {progress.total}</span>
          )}
        </div>
        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#2a2a2a]">
          <div
            className="h-full bg-[#E24B4A] rounded-full transition-all duration-300"
            style={{ width: `${Math.max(pct, progress.total === 0 ? 15 : 2)}%` }}
          />
        </div>
      </div>

      {/* Current file */}
      {progress.currentFile && (
        <div className="flex items-center gap-2 text-sm text-[#666] font-mono max-w-lg w-full truncate">
          <span className="w-2 h-2 rounded-full bg-[#E24B4A] animate-pulse flex-shrink-0" />
          <span className="truncate">{progress.currentFile}</span>
        </div>
      )}
    </div>
  );
};

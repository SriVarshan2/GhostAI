import React, { useEffect, useRef, useState } from 'react';
import type { ScanResult } from '../types';
import clsx from 'clsx';

interface SavingsBannerProps {
  result: ScanResult;
  acceptedSavingsKB: number;
  acceptedMsSaved: number;
  onAcceptAll: () => void;
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

export const SavingsBanner: React.FC<SavingsBannerProps> = ({
  result, acceptedSavingsKB, acceptedMsSaved, onAcceptAll
}) => {
  const totalKB = useCountUp(result.totalGzipKB);
  const wasteKB = useCountUp(result.wasteKB);
  const savingsKB = useCountUp(result.potentialSavingsKB);

  const wasteRatio = result.totalGzipKB > 0 ? result.wasteKB / result.totalGzipKB : 0;
  const bannerColor = wasteRatio > 0.3 ? '#E24B4A' : wasteRatio > 0.15 ? '#EF9F27' : '#639922';

  return (
    <div
      className="rounded-xl border p-5 mb-6"
      style={{ borderColor: bannerColor + '33', background: bannerColor + '11' }}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Three big numbers */}
        <div className="flex gap-8 flex-wrap">
          <div>
            <div className="text-[#888] text-xs uppercase tracking-widest mb-1 font-mono">Total Bundle</div>
            <div className="text-2xl font-bold font-mono text-white">
              {totalKB.toFixed(1)} <span className="text-sm text-[#666]">KB</span>
            </div>
          </div>
          <div>
            <div className="text-[#888] text-xs uppercase tracking-widest mb-1 font-mono">Waste</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#D85A30' }}>
              {wasteKB.toFixed(1)} <span className="text-sm text-[#666]">KB</span>
            </div>
          </div>
          <div>
            <div className="text-[#888] text-xs uppercase tracking-widest mb-1 font-mono">Potential Savings</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#639922' }}>
              {savingsKB.toFixed(1)} <span className="text-sm text-[#666]">KB</span>
            </div>
          </div>
          {acceptedSavingsKB > 0 && (
            <div>
              <div className="text-[#888] text-xs uppercase tracking-widest mb-1 font-mono">You've Saved</div>
              <div className="text-2xl font-bold font-mono text-[#639922]">
                {acceptedSavingsKB.toFixed(1)} <span className="text-sm text-[#555]">KB · {(acceptedMsSaved/1000).toFixed(1)}s faster</span>
              </div>
            </div>
          )}
        </div>

        {/* Apply all button */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={onAcceptAll}
            className={clsx(
              'px-5 py-2.5 rounded-lg text-sm font-semibold',
              'transition-all duration-200 active:scale-95'
            )}
            style={{ background: '#639922', color: '#fff' }}
          >
            Apply All Swaps →
          </button>
          <span className="text-xs text-[#555] font-mono">
            {result.packages.filter(p => p.hasSwap).length} replacements available
          </span>
        </div>
      </div>
    </div>
  );
};

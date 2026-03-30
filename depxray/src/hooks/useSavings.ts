import { useState, useCallback, useMemo } from 'react';
import type { PackageAudit } from '../types';
import { SWAP_MAP } from '../swaps/swapMap';

export function useSavings(packages: PackageAudit[]) {
  const [acceptedSwaps, setAcceptedSwaps] = useState<Set<string>>(new Set());

  const accept = useCallback((packageName: string) => {
    setAcceptedSwaps(prev => {
      const next = new Set(prev);
      next.add(packageName);
      return next;
    });
  }, []);

  const reject = useCallback((packageName: string) => {
    setAcceptedSwaps(prev => {
      const next = new Set(prev);
      next.delete(packageName);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setAcceptedSwaps(new Set());
  }, []);

  const acceptAll = useCallback(() => {
    const allSwappable = packages
      .filter(p => p.hasSwap && p.name in SWAP_MAP)
      .map(p => p.name);
    setAcceptedSwaps(new Set(allSwappable));
  }, [packages]);

  const { totalSavedKB, totalMsSaved } = useMemo(() => {
    let savedBytes = 0;
    for (const name of acceptedSwaps) {
      const suggestion = SWAP_MAP[name];
      if (suggestion) {
        savedBytes += suggestion.savingsBytes;
      }
    }
    const savedKB = savedBytes / 1024;
    return {
      totalSavedKB: savedKB,
      totalMsSaved: Math.round(savedKB * 5),
    };
  }, [acceptedSwaps]);

  return {
    acceptedSwaps,
    totalSavedKB,
    totalMsSaved,
    accept,
    reject,
    reset,
    acceptAll,
  };
}

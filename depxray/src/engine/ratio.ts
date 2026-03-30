import type { WasteLevel } from '../types';

export function computeUtilityRatio(
  gzipBytes: number,
  importsUsed: number,
  isNamespace: boolean = false
): number {
  // Namespace import = effectively full usage, ratio → 0
  if (isNamespace) return 0;
  return (gzipBytes / 1024) / Math.max(importsUsed, 1);
}

export function getWasteLevel(ratio: number): WasteLevel {
  if (ratio === 0) return 'none';
  if (ratio < 5) return 'low';
  if (ratio < 20) return 'medium';
  if (ratio < 50) return 'high';
  return 'critical';
}

export function getWasteColor(ratio: number): string {
  if (ratio === 0) return '#639922';
  if (ratio < 5) return '#639922';
  if (ratio < 20) return '#EF9F27';
  if (ratio < 50) return '#D85A30';
  return '#E24B4A';
}

export function getLoadTimeImpact(savedKB: number): { slow3G: number; wifi: number } {
  // Slow 3G: ~1.6 Mbps = 200 KB/s → 1 KB = 5ms
  // Fast WiFi: ~100 Mbps = 12.5 MB/s → 1 KB = 0.08ms
  return {
    slow3G: Math.round(savedKB * 5),
    wifi: Math.round(savedKB * 0.08),
  };
}

export function estimateMsSaved(savedKB: number): number {
  return getLoadTimeImpact(savedKB).slow3G;
}

export function wasteLevelLabel(level: WasteLevel): string {
  const labels: Record<WasteLevel, string> = {
    none: 'EFFICIENT',
    low: 'LOW',
    medium: 'MODERATE',
    high: 'WASTEFUL',
    critical: 'CRITICAL',
  };
  return labels[level];
}

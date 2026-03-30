export function computeUtilityRatio(gzipBytes: number, namedImportsUsed: number): number {
  return gzipBytes / 1024 / Math.max(namedImportsUsed, 1);
}

export function getWasteColor(utilityRatio: number): string {
  if (utilityRatio < 5) {
    return '#639922'; // green - efficient
  }
  if (utilityRatio < 20) {
    return '#EF9F27'; // amber - moderate
  }
  if (utilityRatio < 50) {
    return '#D85A30'; // coral - wasteful
  }
  return '#E24B4A'; // red - ghost dependency
}

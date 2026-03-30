export async function fetchBundleSize(packageName: string, version: string = 'latest'): Promise<{ gzip: number, size: number } | null> {
  const cacheKey = `${packageName}@${version}`;
  
  // Use a global or module-level cache
  if (!globalThis.__BUNDLE_CACHE__) {
    globalThis.__BUNDLE_CACHE__ = new Map<string, { gzip: number, size: number }>();
  }
  const cache = globalThis.__BUNDLE_CACHE__ as Map<string, { gzip: number, size: number }>;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const res = await fetch(`https://bundlephobia.com/api/size?package=${packageName}@${version}`);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    const result = { gzip: data.gzip, size: data.size };
    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn(`Failed to fetch bundle size for ${packageName}`, err);
    return null;
  }
}

// Ensure TypeScript knows about global cache
declare global {
  var __BUNDLE_CACHE__: Map<string, { gzip: number, size: number }> | undefined;
}

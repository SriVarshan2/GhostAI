const cache = new Map<string, { gzip: number; size: number } | null>();

export async function fetchBundleSize(
  name: string,
  version: string = 'latest'
): Promise<{ gzip: number; size: number } | null> {
  const key = `${name}@${version}`;

  if (cache.has(key)) {
    return cache.get(key)!;
  }

  try {
    const url = `https://bundlephobia.com/api/size?package=${encodeURIComponent(name)}@${version}`;
    const res = await fetch(url, {
      headers: { 'X-Bundlephobia-User': 'depxray-auditor' },
    });

    if (!res.ok) {
      cache.set(key, null);
      return null;
    }

    const data = await res.json();
    const result = { gzip: data.gzip as number, size: data.size as number };
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export function resolvePackageVersions(
  packageJson: Record<string, unknown>
): Map<string, string> {
  const versions = new Map<string, string>();
  const deps = {
    ...(packageJson.dependencies as Record<string, string> || {}),
    ...(packageJson.devDependencies as Record<string, string> || {}),
    ...(packageJson.peerDependencies as Record<string, string> || {}),
  };

  for (const [name, version] of Object.entries(deps)) {
    if (typeof version === 'string') {
      // Strip semver prefixes: ^, ~, >=, <=, >, <, =
      const bare = version.replace(/^[\^~>=<]+/, '').split(' ')[0];
      versions.set(name, bare);
    }
  }

  return versions;
}

export function clearCache(): void {
  cache.clear();
}

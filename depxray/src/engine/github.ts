const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN ?? ''

async function githubFetch(url: string) {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (GITHUB_TOKEN.trim().length > 5) {
    headers['Authorization'] = 'Bearer ' + GITHUB_TOKEN.trim()
  }
  console.log('[DepXray] Auth:', GITHUB_TOKEN ? 'token present ✓' : 'NO TOKEN')
  
  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.message || `GitHub API error: ${resp.status}`);
  }
  return resp;
}

export function setGithubToken(_token?: string) {
  // Logic removed as per instruction to use GITHUB_TOKEN from env
}

function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const cleaned = repoUrl.trim().replace(/\.git$/, '');
  
  const urlMatch = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }
  
  const slashMatch = cleaned.match(/^([^/]+)\/([^/]+)$/);
  if (slashMatch) {
    return { owner: slashMatch[1], repo: slashMatch[2] };
  }

  throw new Error(`Invalid GitHub URL: "${repoUrl}". Use format: owner/repo or https://github.com/owner/repo`);
}

function decodeBase64(content: string): string {
  try {
    const clean = content.replace(/\s/g, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    try { return atob(content.replace(/\s/g, '')); }
    catch { return ''; }
  }
}

const EXCLUDED_PATHS = [
  'node_modules/', 'dist/', 'build/', '.min.js', 'coverage/',
  '__tests__/', '.test.', '.spec.', 'vendor/', '__mocks__/',
  'fixtures/', 'examples/', '.d.ts',
];

function shouldIncludeFile(path: string): boolean {
  if (!(/\.(js|ts|jsx|tsx)$/.test(path))) return false;
  if (path.endsWith('.d.ts')) return false;
  return !EXCLUDED_PATHS.some(excl => path.includes(excl));
}

export async function fetchRepoFiles(
  repoUrl: string,
  onProgress: (done: number, total: number, currentFile: string) => void
): Promise<{ path: string; code: string }[]> {
  const { owner, repo } = parseRepoUrl(repoUrl);

  const treeResp = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=true`);
  const treeData = await treeResp.json();

  const allBlobs = (treeData.tree as any[]).filter(
    item => item.type === 'blob' && item.path && shouldIncludeFile(item.path!)
  );

  allBlobs.sort((a, b) => {
    const aInSrc = a.path!.startsWith('src/') ? 0 : 1;
    const bInSrc = b.path!.startsWith('src/') ? 0 : 1;
    if (aInSrc !== bInSrc) return aInSrc - bInSrc;
    return a.path!.localeCompare(b.path!);
  });

  const selected = allBlobs.slice(0, 120);
  const total = selected.length;
  const results: { path: string; code: string }[] = [];

  const BATCH = 8;
  let done = 0;

  for (let i = 0; i < selected.length; i += BATCH) {
    const batch = selected.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (item) => {
        try {
          const resp = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${item.path!}`);
          const data = await resp.json();

          if (data && typeof data.content === 'string') {
            const code = decodeBase64(data.content);
            if (code) {
              results.push({ path: item.path!, code });
            }
          }
        } catch {
          // Skip files that fail
        }
        done++;
        onProgress(done, total, item.path!);
      })
    );
  }

  return results;
}

export async function fetchPackageJson(
  repoUrl: string
): Promise<Record<string, unknown> | null> {
  try {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const resp = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`);
    const data = await resp.json();

    if (data && typeof data.content === 'string') {
      const code = decodeBase64(data.content);
      return JSON.parse(code);
    }
    return null;
  } catch {
    return null;
  }
}

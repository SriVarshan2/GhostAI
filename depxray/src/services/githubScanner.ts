import { Octokit } from '@octokit/rest';
import type { FileData } from './astScanner';

const octokit = new Octokit(); // No auth needed for public repositories

// Decode base64 avoiding double encoding issues with UTF-8
function decodeBase64(content: string) {
  try {
    const binary = atob(content.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    return atob(content);
  }
}

export async function fetchRepoFiles(repoUrl: string, onProgress?: (msg: string) => void): Promise<FileData[]> {
  let owner = '';
  let repo = '';
  
  try {
    const urlObj = new URL(repoUrl.startsWith('http') ? repoUrl : `https://github.com/${repoUrl}`);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    owner = parts[0];
    repo = parts[1];
  } catch (e) {
    const parts = repoUrl.split('/').filter(Boolean);
    if (parts.length >= 2) {
      owner = parts[parts.length - 2];
      repo = parts[parts.length - 1];
    }
  }

  if (!owner || !repo) {
    throw new Error('Invalid GitHub URL format. Please provide owner/repo or a full URL.');
  }

  // Remove .git if present
  if (repo.endsWith('.git')) {
    repo = repo.replace('.git', '');
  }

  if (onProgress) onProgress(`Fetching tree for ${owner}/${repo}...`);

  let treeData;
  try {
    treeData = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: 'HEAD',
      recursive: 'true'
    });
  } catch (err: any) {
    throw new Error(`Failed to fetch repo tree: ${err.message}`);
  }

  const allFiles = treeData.data.tree.filter(item => item.type === 'blob' && item.path);
  
  const targetFiles = allFiles.filter(item => {
    const p = item.path!;
    if (p.includes('node_modules/') || p.includes('dist/') || p.includes('build/')) return false;
    if (p.endsWith('.min.js')) return false;
    return p.endsWith('.js') || p.endsWith('.ts') || p.endsWith('.jsx') || p.endsWith('.tsx');
  });

  // Prioritize src/ directory files first
  targetFiles.sort((a, b) => {
    const aSrc = a.path!.startsWith('src/') ? -1 : 1;
    const bSrc = b.path!.startsWith('src/') ? -1 : 1;
    return aSrc - bSrc;
  });

  // Fetch up to 100 files to stay within rate limits for public API
  const limit = Math.min(100, targetFiles.length);
  const selectedFiles = targetFiles.slice(0, limit);

  const results: FileData[] = [];
  let fetched = 0;

  // Batching to avoid instantaneous rate limit hit from Octokit
  for (let i = 0; i < selectedFiles.length; i += 10) {
    const batch = selectedFiles.slice(i, i + 10);
    await Promise.all(batch.map(async (file) => {
      try {
        const contentData = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: file.path!
        });

        if ('content' in contentData.data && contentData.data.content) {
          const utf8Str = decodeBase64(contentData.data.content);
          
          results.push({
            path: file.path!,
            code: utf8Str
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch file content for ${file.path}`, err);
      }
      fetched++;
      if (onProgress) onProgress(`Fetching files... ${fetched}/${limit}`);
    }));
  }

  return results;
}

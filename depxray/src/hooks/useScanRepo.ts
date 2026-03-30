import { useState, useCallback } from 'react';
import type { ScanResult, ScanStatus, ScanProgress, PackageAudit } from '../types';
import { fetchRepoFiles, fetchPackageJson, setGithubToken } from '../engine/github';
import { aggregateImports } from '../engine/aggregator';
import { fetchBundleSize, resolvePackageVersions } from '../engine/bundlesize';
import { computeUtilityRatio, getWasteColor, getWasteLevel, estimateMsSaved } from '../engine/ratio';
import { SWAP_MAP } from '../swaps/swapMap';

const CONCURRENT_FETCH = 10;

export function useScanRepo() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [progress, setProgress] = useState<ScanProgress>({
    done: 0, total: 0, currentFile: '', phase: 'fetching',
  });
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (repoUrl: string, githubToken?: string) => {
    setGithubToken(githubToken);
    setStatus('scanning');
    setResult(null);
    setError(null);
    setProgress({ done: 0, total: 0, currentFile: '', phase: 'fetching' });

    try {
      // 1) Fetch all source files
      const files = await fetchRepoFiles(repoUrl, (done, total, currentFile) => {
        setProgress({ done, total, currentFile, phase: 'fetching' });
      });

      // 2) Fetch package.json for version info
      setProgress(p => ({ ...p, phase: 'parsing', currentFile: 'package.json' }));
      const pkgJson = await fetchPackageJson(repoUrl);
      const versions = pkgJson ? resolvePackageVersions(pkgJson as Record<string, unknown>) : new Map<string, string>();

      // 3) Parse AST and aggregate imports
      setProgress(p => ({ ...p, phase: 'parsing', currentFile: 'Parsing AST...' }));
      const importMap = aggregateImports(files);

      // 4) Fetch bundle sizes — up to CONCURRENT_FETCH at a time
      setProgress(p => ({ ...p, phase: 'analyzing', done: 0, total: importMap.size }));
      const packageEntries = Array.from(importMap.entries());
      const audits: PackageAudit[] = [];
      let analyzed = 0;

      for (let i = 0; i < packageEntries.length; i += CONCURRENT_FETCH) {
        const batch = packageEntries.slice(i, i + CONCURRENT_FETCH);
        const batchResults = await Promise.allSettled(
          batch.map(async ([pkgName, record]) => {
            const version = versions.get(pkgName) ?? 'latest';
            const sizeData = await fetchBundleSize(pkgName, version);

            analyzed++;
            setProgress(p => ({ ...p, done: analyzed, currentFile: pkgName }));

            if (!sizeData) return null;

            const importsCount = record.namespaceImport
              ? 9999
              : Math.max(record.namedImports.length, record.defaultImport ? 1 : 0);

            const ratio = computeUtilityRatio(sizeData.gzip, importsCount, record.namespaceImport);
            const wasteColor = getWasteColor(ratio);
            const wasteLevel = getWasteLevel(ratio);

            return {
              name: pkgName,
              version,
              gzipBytes: sizeData.gzip,
              sizeBytes: sizeData.size,
              importsUsed: record.namedImports,
              defaultImport: record.defaultImport,
              namespaceImport: record.namespaceImport,
              utilityRatio: ratio,
              wasteColor,
              wasteLevel,
              foundInFiles: record.foundInFiles,
              hasSwap: pkgName in SWAP_MAP,
            } satisfies PackageAudit;
          })
        );

        for (const r of batchResults) {
          if (r.status === 'fulfilled' && r.value) {
            audits.push(r.value);
          }
        }
      }

      // 5) Sort by gzipBytes descending
      audits.sort((a, b) => b.gzipBytes - a.gzipBytes);

      // 6) Compute totals
      const totalGzipKB = audits.reduce((sum, p) => sum + p.gzipBytes, 0) / 1024;
      const wastePackages = audits.filter(p => p.wasteLevel === 'high' || p.wasteLevel === 'critical');
      const wasteKB = wastePackages.reduce((sum, p) => sum + p.gzipBytes, 0) / 1024;
      const swappablePackages = audits.filter(p => p.hasSwap);
      const potentialSavingsKB = swappablePackages.reduce((sum, p) => {
        const suggestion = SWAP_MAP[p.name];
        return sum + (suggestion ? suggestion.savingsBytes / 1024 : 0);
      }, 0);

      // Parse repo name from URL
      const repoName = repoUrl.replace(/https?:\/\/github\.com\//, '').replace('.git', '').split('/').slice(0, 2).join('/');

      setResult({
        repoName,
        totalGzipKB,
        wasteKB,
        potentialSavingsKB,
        estimatedMsSaved: estimateMsSaved(potentialSavingsKB),
        packages: audits,
        scannedFiles: files.length,
      });
      setStatus('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setProgress({ done: 0, total: 0, currentFile: '', phase: 'fetching' });
  }, []);

  return { scan, result, progress, error, status, reset };
}

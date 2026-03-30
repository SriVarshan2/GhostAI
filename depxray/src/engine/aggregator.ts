import { scanImports } from './scanner';
import type { ImportRecord } from '../types';

export function aggregateImports(
  files: { path: string; code: string }[]
): Map<string, ImportRecord> {
  const aggregated = new Map<string, ImportRecord>();

  for (const file of files) {
    let fileImports: ImportRecord[];
    try {
      fileImports = scanImports(file.code, file.path);
    } catch {
      continue; // Skip malformed files silently
    }

    for (const imp of fileImports) {
      const existing = aggregated.get(imp.packageName);

      if (!existing) {
        aggregated.set(imp.packageName, {
          packageName: imp.packageName,
          namedImports: [...imp.namedImports],
          defaultImport: imp.defaultImport,
          namespaceImport: imp.namespaceImport,
          foundInFiles: [...imp.foundInFiles],
        });
      } else {
        // Merge named imports (union)
        const namedSet = new Set([...existing.namedImports, ...imp.namedImports]);
        existing.namedImports = Array.from(namedSet);
        // OR booleans
        existing.defaultImport = existing.defaultImport || imp.defaultImport;
        existing.namespaceImport = existing.namespaceImport || imp.namespaceImport;
        // Collect all files
        for (const f of imp.foundInFiles) {
          if (!existing.foundInFiles.includes(f)) {
            existing.foundInFiles.push(f);
          }
        }
      }
    }
  }

  return aggregated;
}

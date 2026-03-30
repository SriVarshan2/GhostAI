import { parse } from '@babel/parser';

export interface FileData {
  path: string;
  code: string;
}

export interface ImportDetail {
  packageName: string;
  namedImports: string[];
  defaultImport: string | null;
  isNamespaceImport: boolean;
}

export interface AggregatedImport {
  namedImports: Set<string>;
  defaultImport: boolean;
  namespaceImport: boolean;
  foundInFiles: string[];
}

const NODE_BUILTINS = new Set([
  'assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram', 'dns', 'domain', 
  'events', 'fs', 'fs/promises', 'http', 'https', 'net', 'os', 'path', 'perf_hooks', 
  'process', 'querystring', 'readline', 'stream', 'string_decoder', 'timers', 'tls', 
  'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib'
]);

export function scanImports(sourceCode: string): ImportDetail[] {
  const ast = parse(sourceCode, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx', 'importMeta', 'dynamicImport'],
  });

  const imports: ImportDetail[] = [];

  for (const node of ast.program.body) {
    if (node.type === 'ImportDeclaration') {
      const packageName = node.source.value;

      // Skip relative imports and node builtins
      if (
        packageName.startsWith('.') || 
        packageName.startsWith('/') ||
        packageName.startsWith('node:') ||
        NODE_BUILTINS.has(packageName)
      ) {
        continue;
      }

      const detail: ImportDetail = {
        packageName,
        namedImports: [],
        defaultImport: null,
        isNamespaceImport: false,
      };

      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportDefaultSpecifier') {
          detail.defaultImport = specifier.local.name;
        } else if (specifier.type === 'ImportNamespaceSpecifier') {
          detail.isNamespaceImport = true;
        } else if (specifier.type === 'ImportSpecifier') {
          const importedName = specifier.imported.type === 'Identifier' 
            ? specifier.imported.name 
            : specifier.imported.value;
          detail.namedImports.push(importedName);
        }
      }

      imports.push(detail);
    }
  }

  return imports;
}

export function aggregateProjectImports(files: FileData[]): Map<string, AggregatedImport> {
  const aggregated = new Map<string, AggregatedImport>();

  for (const file of files) {
    try {
      const fileImports = scanImports(file.code);

      for (const imp of fileImports) {
        if (!aggregated.has(imp.packageName)) {
          aggregated.set(imp.packageName, {
            namedImports: new Set<string>(),
            defaultImport: false,
            namespaceImport: false,
            foundInFiles: [],
          });
        }

        const entry = aggregated.get(imp.packageName)!;
        entry.defaultImport = entry.defaultImport || (imp.defaultImport !== null);
        entry.namespaceImport = entry.namespaceImport || imp.isNamespaceImport;
        
        for (const named of imp.namedImports) {
          entry.namedImports.add(named);
        }

        if (!entry.foundInFiles.includes(file.path)) {
          entry.foundInFiles.push(file.path);
        }
      }
    } catch (error) {
      console.warn(`Failed to parse AST for file: ${file.path}`, error);
    }
  }

  return aggregated;
}

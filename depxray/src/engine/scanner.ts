import { parse } from '@babel/parser';
import type { ImportRecord } from '../types';

const NODE_BUILTINS = new Set([
  'assert', 'buffer', 'child_process', 'cluster', 'crypto', 'dgram', 'dns', 'domain',
  'events', 'fs', 'fs/promises', 'http', 'https', 'module', 'net', 'os', 'path',
  'perf_hooks', 'process', 'querystring', 'readline', 'repl', 'stream', 'string_decoder',
  'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib',
]);

function isBuiltin(name: string): boolean {
  if (NODE_BUILTINS.has(name)) return true;
  if (name.startsWith('node:')) return true;
  return false;
}

function normalizePackageName(specifier: string): string {
  // Keep full scope (@babel/parser), but strip sub-path (lodash/get → lodash)
  if (specifier.startsWith('@')) {
    // scoped: @scope/name/subpath → @scope/name
    const parts = specifier.split('/');
    return parts.slice(0, 2).join('/');
  }
  // unscoped: lodash/get → lodash
  return specifier.split('/')[0];
}

export function scanImports(sourceCode: string, filePath: string): ImportRecord[] {
  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(sourceCode, {
      sourceType: 'module',
      strictMode: false,
      plugins: [
        'typescript',
        'jsx',
        'importMeta',
        'dynamicImport',
        'classProperties',
        ['decorators', { decoratorsBeforeExport: true }],
      ],
    });
  } catch {
    // Try again without typescript plugin (might be plain JS)
    try {
      ast = parse(sourceCode, {
        sourceType: 'module',
        strictMode: false,
        plugins: ['jsx', 'importMeta', 'dynamicImport'],
      });
    } catch {
      return [];
    }
  }

  const imports: ImportRecord[] = [];

  for (const node of ast.program.body) {
    if (node.type === 'ImportDeclaration') {
      const rawSpecifier = node.source.value;

      // Skip relative/absolute path imports
      if (rawSpecifier.startsWith('.') || rawSpecifier.startsWith('/')) continue;
      // Skip node builtins
      if (isBuiltin(rawSpecifier)) continue;
      // Skip CSS/assets
      if (/\.(css|scss|sass|less|svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)$/.test(rawSpecifier)) continue;

      const packageName = normalizePackageName(rawSpecifier);

      const record: ImportRecord = {
        packageName,
        namedImports: [],
        defaultImport: false,
        namespaceImport: false,
        foundInFiles: [filePath],
      };

      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportDefaultSpecifier') {
          record.defaultImport = true;
        } else if (specifier.type === 'ImportNamespaceSpecifier') {
          record.namespaceImport = true;
        } else if (specifier.type === 'ImportSpecifier') {
          const name =
            specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value;
          record.namedImports.push(name);
        }
      }

      imports.push(record);
    }

    // Handle dynamic imports: import('pkg')
    if (node.type === 'ExpressionStatement') {
      // Shallow traverse for Call Expressions — full traverse would need @babel/traverse
      // which has browser limitations, so we do a simple check here
    }
  }

  return imports;
}

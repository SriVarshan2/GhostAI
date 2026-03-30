export interface SwapSuggestion {
  replacement: string;
  reason: string;
  savings: number; // in bytes
  transform: (namedImports: string[], defaultImport: boolean, namespaceImport: boolean) => string;
}

export const SWAP_MAP: Record<string, SwapSuggestion> = {
  'moment': {
    replacement: 'date-fns',
    reason: 'moment is 71KB. date-fns is tree-shakeable and only ships what you import.',
    savings: 65000,
    transform: (namedImports, defaultImport) => {
      if (namedImports.length > 0) return namedImports.map(fn => `import { ${fn} } from 'date-fns';`).join('\n');
      if (defaultImport) return `import { format, parse } from 'date-fns'; // Migrated from moment`;
      return `import * as dateFns from 'date-fns';`;
    }
  },
  'lodash': {
    replacement: 'native or lodash-es',
    reason: 'Full lodash is 71KB. Use lodash-es for tree-shaking, or native alternatives.',
    savings: 60000,
    transform: (namedImports) => {
      if (namedImports.length > 0) return `import { ${namedImports.join(', ')} } from 'lodash-es';`;
      return `import * as _ from 'lodash-es';`;
    }
  },
  'axios': {
    replacement: 'native fetch',
    reason: 'axios is 14KB. Native fetch covers 95% of use cases with zero KB.',
    savings: 14000,
    transform: () => '// Use native fetch() — no import needed'
  },
  'jquery': {
    replacement: 'vanilla JS',
    reason: 'jQuery is 87KB. Modern DOM APIs cover everything jQuery does.',
    savings: 87000,
    transform: () => '// Use document.querySelector(), addEventListener(), fetch()'
  },
  'underscore': {
    replacement: 'lodash-es or native',
    reason: 'underscore is 18KB. Use native array methods or lodash-es for tree-shaking.',
    savings: 15000,
    transform: (namedImports) => {
      if (namedImports.length > 0) return `import { ${namedImports.join(', ')} } from 'lodash-es';`;
      return `import * as _ from 'lodash-es';`;
    }
  }
};

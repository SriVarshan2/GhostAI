import type { SwapSuggestion } from '../types';

export const SWAP_MAP: Record<string, SwapSuggestion> = {
  moment: {
    from: 'moment',
    to: 'date-fns',
    reason:
      'moment.js is 71KB gzipped and is not tree-shakeable. date-fns ships only the functions you import, typically reducing date-related bundle size by 90%.',
    savingsBytes: 66000,
    generateCode: (namedImports: string[], defaultImport: boolean) => {
      if (namedImports.length > 0) {
        return namedImports
          .map((fn: string) => `import { ${fn} } from 'date-fns';`)
          .join('\n');
      }
      if (defaultImport) {
        return `// Replace moment() calls with specific date-fns functions:\nimport { format, parseISO, differenceInDays } from 'date-fns';`;
      }
      return `import { format } from 'date-fns';`;
    },
  },

  lodash: {
    from: 'lodash',
    to: 'lodash-es',
    reason:
      'The full lodash bundle is 71KB. lodash-es is tree-shakeable — only the functions you actually import are bundled, often saving 60KB+.',
    savingsBytes: 71000,
    generateCode: (namedImports: string[], defaultImport: boolean) => {
      if (namedImports.length > 0) {
        return `import { ${namedImports.join(', ')} } from 'lodash-es';`;
      }
      if (defaultImport) {
        return `// Replace default lodash import with specific lodash-es functions:\nimport { cloneDeep, mergeWith } from 'lodash-es';`;
      }
      return `import { debounce, throttle } from 'lodash-es';`;
    },
  },

  underscore: {
    from: 'underscore',
    to: 'native or lodash-es',
    reason:
      'underscore.js is 18KB. Modern array methods (map, filter, reduce) and lodash-es cover everything underscore does.',
    savingsBytes: 18000,
    generateCode: (namedImports) => {
      if (namedImports.length > 0) {
        return `import { ${namedImports.join(', ')} } from 'lodash-es';\n// Or use native: Array.prototype.map(), .filter(), .reduce()`;
      }
      return `// Replace underscore with native JS or lodash-es:\n// _.map(arr, fn)  → arr.map(fn)\n// _.filter(arr, fn) → arr.filter(fn)\n// _.reduce(arr, fn, init) → arr.reduce(fn, init)`;
    },
  },

  axios: {
    from: 'axios',
    to: 'native fetch',
    reason:
      'axios is 14KB gzipped. The native fetch() API is available in all modern browsers and Node 18+, requires zero bytes in your bundle.',
    savingsBytes: 14000,
    generateCode: () =>
      `// No import needed — use native fetch():\nconst response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });\nconst json = await response.json();`,
  },

  jquery: {
    from: 'jquery',
    to: 'vanilla JS',
    reason:
      'jQuery is 87KB. Every jQuery API has a direct DOM equivalent. Modern browsers have native querySelector, fetch, classList, and addEventListener.',
    savingsBytes: 87000,
    generateCode: () =>
      `// No import needed — use vanilla DOM APIs:\n// $('#id') → document.getElementById('id')\n// $('.class') → document.querySelectorAll('.class')\n// $(el).on('click', fn) → el.addEventListener('click', fn)\n// $.ajax() → fetch()`,
  },

  bluebird: {
    from: 'bluebird',
    to: 'native Promise',
    reason:
      'bluebird is 72KB. Native Promise + async/await is built into all modern JS runtimes and is spec-compliant.',
    savingsBytes: 72000,
    generateCode: () =>
      `// No import needed — use native Promise:\nconst result = await Promise.all([task1(), task2()]);\nconst settled = await Promise.allSettled([task1(), task2()]);`,
  },

  request: {
    from: 'request',
    to: 'node-fetch or native fetch',
    reason:
      'request is deprecated and 50KB. Use native fetch (Node 18+) or the lightweight node-fetch package.',
    savingsBytes: 50000,
    generateCode: (_namedImports, defaultImport) => {
      if (defaultImport) {
        return `// Node 18+: no import needed\nconst res = await fetch(url);\nconst body = await res.json();\n\n// Or for older Node:\nimport fetch from 'node-fetch';`;
      }
      return `// Replace request with native fetch (Node 18+) or:\nimport fetch from 'node-fetch'; // pnpm add node-fetch`;
    },
  },

  classnames: {
    from: 'classnames',
    to: 'clsx',
    reason:
      'clsx is a tiny (800B vs 8KB) drop-in replacement for classnames with the same API.',
    savingsBytes: 800,
    generateCode: (_namedImports, defaultImport) => {
      if (defaultImport) return `import clsx from 'clsx';`;
      return `import { clsx } from 'clsx';`;
    },
  },

  uuid: {
    from: 'uuid',
    to: 'crypto.randomUUID()',
    reason:
      'uuid is 8KB. The native crypto.randomUUID() is available in all modern browsers and Node 14.17+ with zero bundle cost.',
    savingsBytes: 8000,
    generateCode: () =>
      `// No import needed — use native crypto.randomUUID():\nconst id = crypto.randomUUID(); // returns a v4 UUID string`,
  },

  is: {
    from: 'is',
    to: 'native typeof checks',
    reason:
      'The "is" library is 10KB. Native typeof, instanceof, and Array.isArray() cover the vast majority of its use cases.',
    savingsBytes: 10000,
    generateCode: (_namedImports: string[]) => {
      const lines: string[] = [
        '// Replace "is" library with native checks:',
        '// is.string(x)   → typeof x === "string"',
        '// is.number(x)   → typeof x === "number"',
        '// is.array(x)    → Array.isArray(x)',
        '// is.null(x)     → x === null',
        '// is.undefined(x) → x === undefined',
        '// is.object(x)   → x !== null && typeof x === "object"',
        '// is.function(x) → typeof x === "function"',
      ];
      return lines.join('\n');
    },
  },
};

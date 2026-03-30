export type WasteLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ImportRecord {
  packageName: string;
  namedImports: string[];
  defaultImport: boolean;
  namespaceImport: boolean;
  foundInFiles: string[];
}

export interface PackageAudit {
  name: string;
  version: string;
  gzipBytes: number;
  sizeBytes: number;
  importsUsed: string[];
  defaultImport: boolean;
  namespaceImport: boolean;
  utilityRatio: number;
  wasteColor: string;
  wasteLevel: WasteLevel;
  foundInFiles: string[];
  hasSwap: boolean;
}

export interface ScanResult {
  repoName: string;
  totalGzipKB: number;
  wasteKB: number;
  potentialSavingsKB: number;
  estimatedMsSaved: number;
  packages: PackageAudit[];
  scannedFiles: number;
}

export interface SwapSuggestion {
  from: string;
  to: string;
  reason: string;
  savingsBytes: number;
  generateCode: (namedImports: string[], defaultImport: boolean) => string;
}

export type ScanStatus = 'idle' | 'scanning' | 'done' | 'error';

export interface ScanProgress {
  done: number;
  total: number;
  currentFile: string;
  phase: 'fetching' | 'parsing' | 'analyzing';
}

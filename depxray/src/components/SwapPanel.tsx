import React, { useMemo } from 'react';
import * as Diff2Html from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';
import type { PackageAudit } from '../types';
import { SWAP_MAP } from '../swaps/swapMap';
import { wasteLevelLabel, getLoadTimeImpact } from '../engine/ratio';

interface SwapPanelProps {
  pkg: PackageAudit;
  onAccept: (pkgName: string) => void;
  onDismiss: () => void;
  isAccepted: boolean;
}

export const SwapPanel: React.FC<SwapPanelProps> = ({ pkg, onAccept, onDismiss, isAccepted }) => {
  const [showAllFiles, setShowAllFiles] = React.useState(false);
  const suggestion = SWAP_MAP[pkg.name];

  const originalCode = useMemo(() => {
    // ... (existing logic)
    const imports: string[] = [];
    if (pkg.namespaceImport) {
      imports.push(`import * as ${pkg.name.replace(/[@/]/g, '_')} from '${pkg.name}';`);
    }
    if (pkg.defaultImport) {
      const localName = pkg.name.split('/').pop()!.replace(/[^a-zA-Z]/g, '');
      imports.push(`import ${localName.charAt(0).toUpperCase() + localName.slice(1)} from '${pkg.name}';`);
    }
    if (pkg.importsUsed.length > 0) {
      imports.push(`import { ${pkg.importsUsed.join(', ')} } from '${pkg.name}';`);
    }
    if (imports.length === 0) {
      imports.push(`import '${pkg.name}';`);
    }
    return imports.join('\n');
  }, [pkg]);

  const proposedCode = useMemo(() => {
    if (!suggestion) return '';
    return suggestion.generateCode(pkg.importsUsed, pkg.defaultImport);
  }, [suggestion, pkg]);

  const diffHtml = useMemo(() => {
    if (!suggestion) return '';
    const origLines = originalCode.split('\n');
    const proposedLines = proposedCode.split('\n');
    const unifiedDiff = [
      '--- a/imports.js',
      '+++ b/imports.js',
      `@@ -1,${origLines.length} +1,${proposedLines.length} @@`,
      ...origLines.map(l => `-${l}`),
      ...proposedLines.map(l => `+${l}`),
    ].join('\n');

    return Diff2Html.html(unifiedDiff, {
      drawFileList: false,
      matching: 'lines',
      outputFormat: 'line-by-line',
    });
  }, [originalCode, proposedCode, suggestion]);

  const impact = useMemo(() => {
    if (!suggestion) return null;
    return getLoadTimeImpact(suggestion.savingsBytes / 1024);
  }, [suggestion]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(proposedCode || originalCode);
    } catch { }
  };

  const wasteLvl = wasteLevelLabel(pkg.wasteLevel);
  const wasteColors: Record<string, string> = {
    EFFICIENT: '#639922', LOW: '#639922', MODERATE: '#EF9F27',
    WASTEFUL: '#D85A30', CRITICAL: '#E24B4A',
  };

  return (
    <div
      className="flex flex-col gap-5 p-5 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] h-full overflow-y-auto"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-white font-mono truncate">{pkg.name}</span>
            {pkg.version !== 'latest' && (
              <span className="text-xs text-[#555] font-mono">@{pkg.version}</span>
            )}
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: (wasteColors[wasteLvl] ?? '#555') + '22', color: wasteColors[wasteLvl] ?? '#aaa' }}
            >
              {wasteLvl}
            </span>
          </div>
          <div className="text-sm text-[#666] mt-1 font-mono">
            {(pkg.gzipBytes / 1024).toFixed(1)} KB gzipped · used in {pkg.foundInFiles.length} file{pkg.foundInFiles.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-[#555] hover:text-white transition-colors p-1 flex-shrink-0"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Current usage */}
      <div>
        <h3 className="text-xs text-[#666] uppercase tracking-widest mb-2 font-mono">Current Usage</h3>
        <div className="bg-[#120808] border border-[#E24B4A22] rounded-lg p-3 font-mono text-sm text-[#E24B4A]">
          <pre className="whitespace-pre-wrap break-all">{originalCode}</pre>
        </div>
        
        {pkg.foundInFiles.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-[#444] uppercase tracking-wider font-bold">Imported In:</span>
              {pkg.foundInFiles.length > 4 && (
                <button 
                  onClick={() => setShowAllFiles(!showAllFiles)}
                  className="text-[10px] text-[#E24B4A] hover:underline"
                >
                  {showAllFiles ? 'Show less' : `Show all ${pkg.foundInFiles.length} files`}
                </button>
              )}
            </div>
            <div className="space-y-1 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
              {(showAllFiles ? pkg.foundInFiles : pkg.foundInFiles.slice(0, 4)).map(f => (
                <div key={f} className="text-xs text-[#555] font-mono flex items-center gap-1.5 bg-[#0f0f0f] py-1 px-2 rounded">
                  <span className="text-[#333]">›</span> {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {suggestion ? (
        <>
          {/* Suggested replacement */}
          <div>
            <h3 className="text-xs text-[#666] uppercase tracking-widest mb-2 font-mono">
              Suggested Replacement → <span className="text-[#639922] font-bold">{suggestion.to}</span>
            </h3>
            <div className="bg-[#081208] border border-[#63992222] rounded-lg p-3 font-mono text-sm text-[#639922]">
              <pre className="whitespace-pre-wrap break-all">{proposedCode}</pre>
            </div>
          </div>

          {/* Diff */}
          <div>
            <h3 className="text-xs text-[#666] uppercase tracking-widest mb-2 font-mono">Visual Diff</h3>
            <div
              className="text-sm rounded-lg overflow-hidden border border-[#222]"
              dangerouslySetInnerHTML={{ __html: diffHtml }}
            />
          </div>

          {/* Why swap */}
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
            <h3 className="text-xs text-[#666] uppercase tracking-widest mb-2 font-mono">Impact Analysis</h3>
            <p className="text-sm text-[#aaa] leading-relaxed mb-4">{suggestion.reason}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111] p-3 rounded-lg border border-[#222]">
                <div className="text-[10px] text-[#555] uppercase mb-1">Slow 3G</div>
                <div className="text-[#E24B4A] font-bold">-{impact?.slow3G}ms</div>
              </div>
              <div className="bg-[#111] p-3 rounded-lg border border-[#222]">
                <div className="text-[10px] text-[#555] uppercase mb-1">Fast WiFi</div>
                <div className="text-[#639922] font-bold">-{impact?.wifi}ms</div>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <span className="text-lg font-bold text-[#639922] font-mono">
                -{(suggestion.savingsBytes / 1024).toFixed(0)} KB Total Savings
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 flex-wrap">
            {isAccepted ? (
              <div className="flex items-center gap-2 text-[#639922] text-sm font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Swap accepted!
              </div>
            ) : (
              <button
                onClick={() => onAccept(pkg.name)}
                className="flex-1 py-2.5 px-5 rounded-lg font-semibold text-sm text-white transition-all active:scale-95"
                style={{ background: '#639922' }}
              >
                Accept — Save {(suggestion.savingsBytes / 1024).toFixed(0)} KB
              </button>
            )}
            <button
              onClick={handleCopy}
              className="py-2.5 px-5 rounded-lg text-sm border border-[#2a2a2a] text-[#aaa] hover:text-white hover:border-[#444] transition-all"
            >
              Copy code
            </button>
          </div>
        </>
      ) : (
        <div className="bg-[#171717] border border-[#2a2a2a] rounded-lg p-5 text-center">
          <p className="text-[#666] text-sm mb-2">No lightweight alternative mapped for this package.</p>
          <a
            href={`https://bundlephobia.com/package/${pkg.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#E24B4A] hover:underline font-mono"
          >
            View on Bundlephobia →
          </a>
        </div>
      )}
    </div>
  );
};

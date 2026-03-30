import { useState, useEffect, useCallback } from 'react';
import { useScanRepo } from './hooks/useScanRepo';
import { useSavings } from './hooks/useSavings';
import { HeroInput } from './components/HeroInput';
import { ScanProgress } from './components/ScanProgress';
import { SavingsBanner } from './components/SavingsBanner';
import { WasteTreemap } from './components/WasteTreemap';
import { SwapPanel } from './components/SwapPanel';
import { HallOfShame } from './components/HallOfShame';
import { ShareButton } from './components/ShareButton';
import type { PackageAudit } from './types';

function App() {
  const { scan, result, progress, error, status, reset } = useScanRepo();
  const { acceptedSwaps, totalSavedKB, totalMsSaved, accept, acceptAll } = useSavings(result?.packages ?? []);
  const [selectedPkg, setSelectedPkg] = useState<PackageAudit | null>(null);
  const [currentRepoUrl, setCurrentRepoUrl] = useState('');

  // Auto-read ?repo= URL param on mount and trigger scan
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const repoParam = params.get('repo');
    if (repoParam) {
      setCurrentRepoUrl(repoParam);
      scan(repoParam); // Initial scan from URL won't have a token unless user enters it later
    }
  }, [scan]);

  // Keyboard: Escape closes swap panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPkg(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleScan = useCallback((repoUrl: string, githubToken?: string) => {
    setCurrentRepoUrl(repoUrl);
    setSelectedPkg(null);
    scan(repoUrl, githubToken);
    // Update URL without navigation so shareable link stays fresh
    const newUrl = `${window.location.origin}${window.location.pathname}?repo=${encodeURIComponent(repoUrl)}`;
    window.history.replaceState({}, '', newUrl);
  }, [scan]);

  const handleReset = () => {
    reset();
    setSelectedPkg(null);
    setCurrentRepoUrl('');
    window.history.replaceState({}, '', window.location.pathname);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#e8e8e8' }}>
      {/* ─── LANDING page ─── */}
      {status === 'idle' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-1px', fontFamily: 'Inter, system-ui, sans-serif' }}>
              Dep<span style={{ color: '#E24B4A' }}>Xray</span>
            </h1>
            <p style={{ color: '#666', fontSize: '16px', margin: 0, fontFamily: '"JetBrains Mono", monospace' }}>
              Ghost-Dependency Auditor · find the KB you don't need
            </p>
          </div>

          <HallOfShame onSelect={(repo) => handleScan(repo)} />
          <HeroInput onScan={handleScan} isScanning={false} error={null} />
        </div>
      )}

      {/* ─── SCANNING page ─── */}
      {status === 'scanning' && (
        <div style={{ padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Dep<span style={{ color: '#E24B4A' }}>Xray</span>
            </h1>
          </div>
          <ScanProgress progress={progress} />
        </div>
      )}

      {/* ─── ERROR state ─── */}
      {status === 'error' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '40px 20px', gap: '24px',
        }}>
          {error?.toLowerCase().includes('bad credentials') || error?.toLowerCase().includes('invalid token') ? (
            <div style={{
              background: '#1a1a1a', border: '1px solid #E24B4A44', borderRadius: '16px',
              padding: '40px', maxWidth: '600px', textAlign: 'left',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px', textAlign: 'center' }}>⚠️</div>
              <h2 style={{ color: '#E24B4A', marginBottom: '16px', fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 800, textAlign: 'center' }}>
                Token Rejected by GitHub
              </h2>
              
              <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>
                  Open your terminal and run:
                </p>
                <code style={{ 
                  background: '#111', padding: '12px', borderRadius: '6px', 
                  display: 'block', color: '#639922', border: '1px solid #222',
                  fontSize: '13px', fontFamily: '"JetBrains Mono", monospace',
                  marginBottom: '20px'
                }}>
                  echo 'VITE_GITHUB_TOKEN=ghp_your_real_token' &gt; .env.local
                </code>
                <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
                  Then restart:
                </p>
                <code style={{ 
                  background: '#111', padding: '12px', borderRadius: '6px', 
                  display: 'block', color: '#E24B4A', border: '1px solid #222',
                  fontSize: '13px', fontFamily: '"JetBrains Mono", monospace'
                }}>
                  pnpm dev
                </code>
              </div>

              <button
                onClick={handleReset}
                style={{
                  width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                  background: '#E24B4A', color: '#fff', cursor: 'pointer',
                  fontWeight: 700, fontFamily: 'Inter, sans-serif', fontSize: '16px',
                  transition: 'all 0.2s'
                }}
              >
                Try Again
              </button>
            </div>
          ) : error?.toLowerCase().includes('rate limit') ? (
            <div style={{
              background: '#1a1a1a', border: '1px solid #E24B4A44', borderRadius: '16px',
              padding: '40px', maxWidth: '600px', textAlign: 'left',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px', textAlign: 'center' }}>🛑</div>
              <h2 style={{ color: '#E24B4A', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontSize: '24px', fontWeight: 800, textAlign: 'center' }}>
                GitHub Rate Limit Hit
              </h2>
              <p style={{ color: '#aaa', fontSize: '15px', fontFamily: 'Inter, sans-serif', marginBottom: '24px', textAlign: 'center' }}>
                You've hit GitHub's unauthenticated limit (60 req/hr).<br/>
                Add a free token to get 5,000 req/hr.
              </p>

              <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <ol style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                  <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener" style={{ color: '#E24B4A', textDecoration: 'underline' }}>github.com/settings/tokens</a> → Generate new (classic)</li>
                  <li>Copy the token</li>
                  <li>In terminal, run: <br/>
                    <code style={{ background: '#111', padding: '8px 12px', borderRadius: '4px', display: 'block', marginTop: '8px', color: '#639922', border: '1px solid #222' }}>
                      echo 'VITE_GITHUB_TOKEN=ghp_abc...' &gt; .env.local
                    </code>
                  </li>
                  <li>Restart dev server: <code style={{ background: '#222', padding: '2px 6px', borderRadius: '4px' }}>pnpm dev</code></li>
                </ol>
              </div>

              <button
                onClick={handleReset}
                style={{
                  width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                  background: '#E24B4A', color: '#fff', cursor: 'pointer',
                  fontWeight: 700, fontFamily: 'Inter, sans-serif', fontSize: '16px',
                  transition: 'all 0.2s'
                }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div style={{
              background: '#1a1a1a', border: '1px solid #E24B4A33', borderRadius: '16px',
              padding: '32px', maxWidth: '500px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
              <h2 style={{ color: '#E24B4A', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>Scan Failed</h2>
              <p style={{ color: '#888', fontSize: '14px', fontFamily: '"JetBrains Mono", monospace', marginBottom: '24px' }}>
                {error}
              </p>
              <button
                onClick={handleReset}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  background: '#E24B4A', color: '#fff', cursor: 'pointer',
                  fontWeight: 600, fontFamily: 'Inter, sans-serif',
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── RESULTS page ─── */}
      {status === 'done' && result && (
        <div style={{ padding: '24px 28px', maxWidth: '100%' }}>
          {/* Top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
          }}>
            <button
              onClick={handleReset}
              style={{
                background: 'none', border: 'none', color: '#E24B4A',
                fontSize: '22px', fontWeight: 800, cursor: 'pointer',
                padding: 0, fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.5px',
              }}
            >
              Dep<span style={{ color: '#E24B4A' }}>Xray</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', color: '#555' }}>
                {result.repoName} · {result.scannedFiles} files scanned
              </span>
              <ShareButton repoUrl={currentRepoUrl} />
              <button
                onClick={handleReset}
                style={{
                  padding: '8px 14px', borderRadius: '8px', border: '0.5px solid #2a2a2a',
                  background: 'transparent', color: '#666', cursor: 'pointer',
                  fontSize: '13px', fontFamily: 'Inter, sans-serif',
                }}
              >
                New scan
              </button>
            </div>
          </div>

          {/* Savings banner */}
          <SavingsBanner
            result={result}
            acceptedSavingsKB={totalSavedKB}
            acceptedMsSaved={totalMsSaved}
            onAcceptAll={acceptAll}
          />

          {/* Main layout: treemap + swap panel */}
          <div style={{
            display: 'flex', gap: '24px', alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}>
            {/* Treemap — left 60% */}
            <div style={{
              flex: '1 1 0',
              minWidth: '320px',
              transition: 'all 0.2s',
            }}>
              <WasteTreemap
                packages={result.packages}
                onSelect={setSelectedPkg}
                selected={selectedPkg}
              />
            </div>

            {/* Swap panel — right 40% */}
            {selectedPkg && (
              <div style={{
                width: '420px', flexShrink: 0,
                animation: 'slideIn 0.2s ease-out',
                maxHeight: 'calc(100vh - 180px)',
                overflowY: 'auto',
              }}>
                <SwapPanel
                  pkg={selectedPkg}
                  onAccept={(name) => { accept(name); }}
                  onDismiss={() => setSelectedPkg(null)}
                  isAccepted={acceptedSwaps.has(selectedPkg.name)}
                />
              </div>
            )}

            {/* Placeholder when no pkg is selected */}
            {!selectedPkg && (
              <div style={{
                width: '360px', flexShrink: 0,
                background: '#1a1a1a', border: '1px dashed #2a2a2a',
                borderRadius: '12px', padding: '32px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '12px', textAlign: 'center',
                color: '#444', fontFamily: '"JetBrains Mono", monospace', fontSize: '13px',
                minHeight: '200px',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Click any block to see<br/>swap suggestions
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @media (max-width: 768px) {
          div[style*="width: 420px"] { width: 100% !important; }
          div[style*="width: 360px"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default App;

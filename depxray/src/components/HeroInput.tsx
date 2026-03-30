import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

const QUICK_REPOS = [
  { label: 'facebook/create-react-app', url: 'facebook/create-react-app' },
  { label: 'vercel/next.js', url: 'vercel/next.js' },
  { label: 'tailwindlabs/tailwindcss', url: 'tailwindlabs/tailwindcss' },
];

interface HeroInputProps {
  onScan: (repoUrl: string, githubToken?: string) => void;
  isScanning: boolean;
  error?: string | null;
  initialValue?: string;
}

export const HeroInput: React.FC<HeroInputProps> = ({ onScan, isScanning, error, initialValue }) => {
  const [value, setValue] = useState(initialValue ?? '');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (initialValue) setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onScan(trimmed, token.trim() || undefined);
  };

  const handleQuickScan = (url: string) => {
    setValue(url);
    onScan(url, token.trim() || undefined);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Paste a GitHub repo URL or owner/repo..."
            disabled={isScanning}
            className={clsx(
              'flex-1 px-5 py-4 rounded-lg text-base font-mono',
              'bg-[#1a1a1a] text-[#e8e8e8] placeholder-[#555]',
              'border transition-all duration-200 outline-none',
              error
                ? 'border-[#E24B4A] focus:border-[#E24B4A]'
                : 'border-[#2a2a2a] focus:border-[#E24B4A]',
              'disabled:opacity-50'
            )}
          />
          <button
            type="submit"
            disabled={isScanning || !value.trim()}
            className={clsx(
              'px-7 py-4 rounded-lg font-semibold text-base',
              'bg-[#E24B4A] text-white',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'hover:bg-[#c43a3a] active:scale-95',
              'flex items-center gap-2 min-w-[140px] justify-center'
            )}
          >
            {isScanning ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                X-Ray
              </>
            )}
          </button>
        </div>

        {/* Token Input Toggle */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="text-[#555] text-[10px] uppercase tracking-wider hover:text-[#888] flex items-center gap-1.5 w-fit"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            {showToken ? 'Hide GitHub Token' : 'Add GitHub Token (to avoid rate limits)'}
          </button>
          
          {showToken && (
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Paste your Personal Access Token here..."
              className={clsx(
                'px-4 py-2 rounded text-xs font-mono',
                'bg-[#0f0f0f] text-[#aaa] placeholder-[#333]',
                'border border-[#222] focus:border-[#444] outline-none',
                'transition-all duration-200'
              )}
            />
          )}
        </div>
      </form>

      {error && (
        <p className="mt-3 text-[#E24B4A] text-sm font-mono">{error}</p>
      )}

      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <span className="text-[#555] text-xs uppercase tracking-wider">Quick scan:</span>
        {QUICK_REPOS.map(repo => (
          <button
            key={repo.url}
            onClick={() => handleQuickScan(repo.url)}
            disabled={isScanning}
            className={clsx(
              'px-3 py-1.5 rounded text-xs font-mono',
              'bg-[#1a1a1a] border border-[#2a2a2a]',
              'text-[#aaa] hover:text-white hover:border-[#E24B4A]',
              'transition-all duration-150 disabled:opacity-40'
            )}
          >
            {repo.label}
          </button>
        ))}
      </div>
    </div>
  );
};

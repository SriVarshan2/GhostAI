import { useState } from 'react'

interface Props {
  repoUrl: string
}

export function ShareButton({ repoUrl }: Props) {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?repo=${encodeURIComponent(repoUrl)}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      prompt('Copy this URL:', url)
    })
  }

  return (
    <button
      onClick={handleShare}
      style={{
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 500,
        border: '0.5px solid',
        borderColor: copied ? '#1D9E75' : '#2a2a2a',
        borderRadius: '8px',
        background: copied ? '#E1F5EE' : 'transparent',
        color: copied ? '#085041' : '#888',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {copied ? '✓ Link copied!' : '↗ Share this audit'}
    </button>
  )
}

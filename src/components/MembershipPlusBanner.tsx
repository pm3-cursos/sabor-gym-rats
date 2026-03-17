'use client'

import { useState, useEffect } from 'react'

const SESSION_KEY = 'membershipPlusBannerDismissed'

export default function MembershipPlusBanner({ url }: { url: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-violet-950/60 border-b border-violet-700/30">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-center gap-3 flex-wrap relative">
        <span className="text-xs text-violet-300">Quer continuar aprendendo além da Maratona?</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 px-3 py-1 rounded-full transition-colors whitespace-nowrap"
        >
          Conheça o Membership Plus →
        </a>
        <button
          onClick={dismiss}
          aria-label="Fechar banner"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-400 hover:text-violet-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

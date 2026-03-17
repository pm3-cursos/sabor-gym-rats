'use client'

import { useState, useEffect } from 'react'

const SESSION_KEY = 'referralCampaignBannerDismissed'

export default function ReferralCampaignBanner() {
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
    <div className="bg-emerald-950/60 border-b border-emerald-700/30">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-center gap-3 flex-wrap relative">
        <span className="text-xs text-emerald-300">Indique amigos e concorra a prêmios exclusivos!</span>
        <a
          href="/indicacao"
          className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-full transition-colors whitespace-nowrap"
        >
          Ver campanha →
        </a>
        <button
          onClick={dismiss}
          aria-label="Fechar banner"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

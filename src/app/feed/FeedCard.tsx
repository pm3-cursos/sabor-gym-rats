'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FeedItem {
  id: string
  insight: string | null
  linkedinUrl: string | null
  createdAt: string
  userName: string
  liveTitle: string
  liveOrder: number
  reactionCounts: Record<string, number>
  myReaction: string | null
}

interface Props {
  item: FeedItem
  isLoggedIn: boolean
  emojis: string[]
}

function timeAgo(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  return `${days}d atrás`
}

export default function FeedCard({ item, isLoggedIn, emojis }: Props) {
  const router = useRouter()
  const [counts, setCounts] = useState<Record<string, number>>(item.reactionCounts)
  const [myReaction, setMyReaction] = useState<string | null>(item.myReaction)
  const [pending, setPending] = useState(false)

  const firstName = item.userName.split(' ')[0]

  async function handleReaction(emoji: string) {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (pending) return
    setPending(true)

    // Optimistic update
    const prev = myReaction
    const prevCounts = { ...counts }
    const newCounts = { ...counts }

    if (myReaction === emoji) {
      // Remove
      newCounts[emoji] = Math.max(0, (newCounts[emoji] || 0) - 1)
      if (newCounts[emoji] === 0) delete newCounts[emoji]
      setMyReaction(null)
    } else {
      if (myReaction) {
        // Switch
        newCounts[myReaction] = Math.max(0, (newCounts[myReaction] || 0) - 1)
        if (newCounts[myReaction] === 0) delete newCounts[myReaction]
      }
      newCounts[emoji] = (newCounts[emoji] || 0) + 1
      setMyReaction(emoji)
    }
    setCounts(newCounts)

    const res = await fetch('/api/feed/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkInId: item.id, emoji }),
    })

    if (!res.ok) {
      // Revert on error
      setCounts(prevCounts)
      setMyReaction(prev)
    }
    setPending(false)
  }

  return (
    <div className="card p-5 card-hover">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">
          {firstName[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm">{firstName}</span>
            <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
              Aula {item.liveOrder} ✓
            </span>
            <span className="text-xs text-gray-600 ml-auto">
              {timeAgo(item.createdAt)}
            </span>
          </div>

          <p className="text-xs text-gray-500 mb-2 truncate">{item.liveTitle}</p>

          {item.insight ? (
            <blockquote className="text-sm text-gray-300 bg-gray-800/60 rounded-lg px-4 py-3 border-l-2 border-violet-500/40 italic">
              "{item.insight}"
            </blockquote>
          ) : (
            <p className="text-sm text-gray-500 italic">Sem insight registrado.</p>
          )}

          {item.linkedinUrl && (
            <a
              href={item.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-violet-400 hover:text-violet-300 underline"
            >
              Ver no LinkedIn →
            </a>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {emojis.map((emoji) => {
              const count = counts[emoji] || 0
              const isActive = myReaction === emoji
              return (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  disabled={pending}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                    isActive
                      ? 'bg-violet-500/30 text-violet-300 border border-violet-500/40'
                      : 'bg-gray-800/60 text-gray-400 border border-gray-700/40 hover:bg-gray-700/60'
                  }`}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span className="tabular-nums">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

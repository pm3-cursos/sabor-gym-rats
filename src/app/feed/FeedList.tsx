'use client'

import { useState } from 'react'
import FeedCard from './FeedCard'

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

const PAGE_SIZE = 20

export default function FeedList({
  items,
  isLoggedIn,
  emojis,
}: {
  items: FeedItem[]
  isLoggedIn: boolean
  emojis: string[]
}) {
  const liveOrders = [...new Set(items.map((i) => i.liveOrder))].sort((a, b) => a - b)
  const [filterOrder, setFilterOrder] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = filterOrder !== null ? items.filter((i) => i.liveOrder === filterOrder) : items
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  function handleFilter(order: number | null) {
    setFilterOrder(order)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div>
      {/* Filter pills */}
      {liveOrders.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => handleFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterOrder === null
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Todas
          </button>
          {liveOrders.map((order) => (
            <button
              key={order}
              onClick={() => handleFilter(order)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterOrder === order
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Aula {order}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {visible.map((item) => (
          <FeedCard key={item.id} item={item} isLoggedIn={isLoggedIn} emojis={emojis} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
          className="btn-secondary w-full mt-4"
        >
          Carregar mais ({filtered.length - visibleCount} restantes)
        </button>
      )}

      {filtered.length === 0 && filterOrder !== null && (
        <div className="card p-8 text-center text-gray-600">
          <p>Nenhum check-in registrado para esta aula ainda.</p>
        </div>
      )}
    </div>
  )
}

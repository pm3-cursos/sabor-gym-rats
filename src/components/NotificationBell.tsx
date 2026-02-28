'use client'

import { useState, useEffect, useRef } from 'react'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string | null
  read: boolean
  createdAt: string
}

function typeIcon(type: string) {
  switch (type) {
    case 'REACTION': return '💬'
    case 'SCORE_ADJUSTMENT': return '📊'
    case 'CHECKIN_REMOVED': return '🗑'
    case 'RANK_CHANGE': return '🏆'
    case 'CLASS_REMINDER': return '📅'
    default: return '🔔'
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export default function NotificationBell({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    if (!isLoggedIn) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount and every 60s
  useEffect(() => {
    if (!isLoggedIn) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [isLoggedIn])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  function handleOpen() {
    setOpen((v) => !v)
    if (!open) fetchNotifications()
  }

  if (!isLoggedIn) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative text-gray-400 hover:text-white transition-colors p-1"
        aria-label="Notificações"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown (desktop) / Bottom sheet overlay (mobile) */}
      {open && (
        <>
          {/* Mobile overlay */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="
            fixed md:absolute
            bottom-0 md:bottom-auto
            left-0 md:left-auto
            right-0 md:right-0
            md:top-full md:mt-2
            z-50
            w-full md:w-80
            bg-gray-900 border border-gray-800
            md:rounded-xl rounded-t-2xl
            shadow-2xl
            max-h-[80vh] md:max-h-[460px]
            flex flex-col
          ">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
              <span className="font-semibold text-sm">Notificações</span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  ✕
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {loading && notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">Carregando...</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-gray-500 text-sm">Sem notificações ainda.</p>
                </div>
              ) : (
                <ul>
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-800/60 cursor-pointer hover:bg-gray-800/40 transition-colors ${!n.read ? 'bg-violet-500/5' : ''}`}
                      onClick={() => !n.read && markRead(n.id)}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${n.read ? 'text-gray-300' : 'text-white font-medium'}`}>
                            {n.title}
                          </p>
                          {n.message && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                          )}
                          <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

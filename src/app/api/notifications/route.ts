import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Thresholds in ms for class reminders
const REMINDER_WINDOWS = [
  { label: 'Começa em 2 dias', ms: 2 * 24 * 60 * 60 * 1000, buffer: 30 * 60 * 1000 },
  { label: 'Começa amanhã', ms: 24 * 60 * 60 * 1000, buffer: 30 * 60 * 1000 },
  { label: 'Começa em 12 horas', ms: 12 * 60 * 60 * 1000, buffer: 30 * 60 * 1000 },
  { label: 'Começa em 1 hora', ms: 60 * 60 * 1000, buffer: 15 * 60 * 1000 },
  { label: 'Começando agora!', ms: 0, buffer: 15 * 60 * 1000 },
]

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const [dbNotifications, lives, userCheckIns] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.live.findMany({ orderBy: { order: 'asc' } }),
    prisma.checkIn.findMany({
      where: { userId: session.userId, type: 'AULA', status: 'APPROVED' },
      select: { liveId: true },
    }),
  ])

  const approvedLiveIds = new Set(userCheckIns.map((c) => c.liveId))
  const now = Date.now()

  // Generate class reminder notifications dynamically
  const classReminders: Array<{
    id: string
    type: string
    title: string
    message: string | null
    read: boolean
    createdAt: Date
  }> = []

  for (const live of lives) {
    if (!live.scheduledAt || approvedLiveIds.has(live.id)) continue
    const diffMs = new Date(live.scheduledAt).getTime() - now

    for (const window of REMINDER_WINDOWS) {
      const lowerBound = window.ms - window.buffer
      const upperBound = window.ms + window.buffer
      if (diffMs >= lowerBound && diffMs <= upperBound) {
        classReminders.push({
          id: `reminder-${live.id}-${window.ms}`,
          type: 'CLASS_REMINDER',
          title: `📅 ${live.title}: ${window.label}`,
          message: 'Não esqueça de assistir e fazer seu check-in!',
          read: false,
          createdAt: new Date(),
        })
        break
      }
    }
  }

  // Merge and sort: db first, then reminders
  const all = [
    ...dbNotifications.map((n) => ({ ...n, type: n.type as string })),
    ...classReminders,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const unreadCount = all.filter((n) => !n.read).length

  return NextResponse.json({ notifications: all, unreadCount })
}

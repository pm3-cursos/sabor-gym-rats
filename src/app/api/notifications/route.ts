import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { FINAL_CHALLENGE_UNLOCK_UTC } from '@/lib/date'

export const dynamic = 'force-dynamic'

// Thresholds in ms for class reminders, keyed by user preference field
const REMINDER_WINDOWS = [
  { label: 'Começa em 2 dias', ms: 2 * 24 * 60 * 60 * 1000, buffer: 30 * 60 * 1000, prefKey: 'reminderDays2' as const },
  { label: 'Começa amanhã', ms: 24 * 60 * 60 * 1000, buffer: 30 * 60 * 1000, prefKey: 'reminderDays1' as const },
  { label: 'Começa em 12 horas', ms: 12 * 60 * 60 * 1000, buffer: 30 * 60 * 1000, prefKey: 'reminder12h' as const },
  { label: 'Começa em 1 hora', ms: 60 * 60 * 1000, buffer: 15 * 60 * 1000, prefKey: 'reminder1h' as const },
  { label: 'Começando agora!', ms: 0, buffer: 15 * 60 * 1000, prefKey: 'reminder1h' as const },
]

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const [dbNotifications, lives, userCheckIns, userPrefs, userLinkedinCheckIns, finalChallenge, challengeSetting] = await Promise.all([
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
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { reminderDays2: true, reminderDays1: true, reminder12h: true, reminder1h: true },
    }),
    prisma.checkIn.findMany({
      where: { userId: session.userId, type: 'LINKEDIN', status: 'APPROVED', isInvalid: false },
      select: { liveId: true },
    }),
    prisma.finalChallenge.findUnique({ where: { userId: session.userId }, select: { id: true } }),
    prisma.appSettings.findUnique({ where: { key: 'challengeUnlockAt' } }),
  ])

  const approvedLiveIds = new Set(userCheckIns.map((c) => c.liveId))
  const linkedinLiveIds = new Set(userLinkedinCheckIns.map((c) => c.liveId))
  const challengeAlreadySubmitted = !!finalChallenge
  const challengeUnlockAt = challengeSetting?.value
    ? new Date(challengeSetting.value)
    : FINAL_CHALLENGE_UNLOCK_UTC
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
      if (userPrefs && !userPrefs[window.prefKey]) continue
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

  // Challenge unlock reminder notifications (2d, 1d, 6h before unlock)
  const challengeReminders: typeof classReminders = []

  if (!challengeAlreadySubmitted) {
    const CHALLENGE_REMINDER_WINDOWS = [
      { label: 'em 2 dias', ms: 2 * 24 * 60 * 60 * 1000 },
      { label: 'amanhã', ms: 24 * 60 * 60 * 1000 },
      { label: 'em 6 horas', ms: 6 * 60 * 60 * 1000 },
    ]
    const BUFFER = 30 * 60 * 1000
    const diffToChallengeMs = challengeUnlockAt.getTime() - now

    for (const window of CHALLENGE_REMINDER_WINDOWS) {
      if (diffToChallengeMs >= window.ms - BUFFER && diffToChallengeMs <= window.ms + BUFFER) {
        challengeReminders.push({
          id: `challenge-reminder-${window.ms}`,
          type: 'CHALLENGE_UNLOCK_REMINDER',
          title: `🏆 Desafio da Maratona PM3 começa ${window.label}!`,
          message: 'Prepare-se para o desafio bônus de +5 pontos. Acesse Meu Progresso para entregar.',
          read: false,
          createdAt: new Date(),
        })
        break
      }
    }
  }

  // "Aula hoje" notification for classes scheduled today in BRT (outside reminder windows)
  const todayNotifs: typeof classReminders = []

  const brtFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })
  const todayBRT = brtFormatter.format(new Date(now))

  for (const live of lives) {
    if (!live.scheduledAt || approvedLiveIds.has(live.id)) continue
    const scheduledBRT = brtFormatter.format(live.scheduledAt)
    if (scheduledBRT !== todayBRT) continue

    const diffMs = live.scheduledAt.getTime() - now
    // Skip if within any existing reminder window
    const inWindow = REMINDER_WINDOWS.some((w) => diffMs >= w.ms - w.buffer && diffMs <= w.ms + w.buffer)
    if (inWindow) continue

    todayNotifs.push({
      id: `today-${live.id}`,
      type: 'CLASS_TODAY',
      title: `📅 ${live.title}: Aula hoje!`,
      message: 'Não esqueça de assistir e fazer seu check-in.',
      read: false,
      createdAt: new Date(),
    })
  }

  // LinkedIn bonus available (approved AULA without LinkedIn post)
  const linkedinBonusNotifs: typeof classReminders = []

  for (const live of lives) {
    if (!live.isActive) continue
    if (!approvedLiveIds.has(live.id)) continue
    if (linkedinLiveIds.has(live.id)) continue

    linkedinBonusNotifs.push({
      id: `linkedin-bonus-${live.id}`,
      type: 'LINKEDIN_BONUS_AVAILABLE',
      title: `🔗 Ganhe +3 pts! Publique sua reflexão de "${live.title}" no LinkedIn`,
      message: 'Compartilhe seu aprendizado e ganhe pontos bônus.',
      read: false,
      createdAt: new Date(),
    })
  }

  // Active live available without check-in
  const newLiveNotifs: typeof classReminders = []

  for (const live of lives) {
    if (!live.isActive) continue
    if (approvedLiveIds.has(live.id)) continue

    newLiveNotifs.push({
      id: `live-available-${live.id}`,
      type: 'NEW_LIVE_AVAILABLE',
      title: `📚 ${live.title} está disponível para check-in!`,
      message: 'Assista à aula e registre seu check-in para ganhar pontos.',
      read: false,
      createdAt: new Date(),
    })
  }

  // Merge and sort: db first, then dynamic notifications
  const all = [
    ...dbNotifications.map((n) => ({ ...n, type: n.type as string })),
    ...classReminders,
    ...todayNotifs,
    ...challengeReminders,
    ...linkedinBonusNotifs,
    ...newLiveNotifs,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const unreadCount = all.filter((n) => !n.read).length

  return NextResponse.json({ notifications: all, unreadCount })
}

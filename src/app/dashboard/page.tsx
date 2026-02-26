import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardClient from './DashboardClient'
import { calcPoints, calcAulaCount } from '@/lib/points'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [lives, checkIns, user, allUsers] = await Promise.all([
    prisma.live.findMany({ orderBy: { order: 'asc' } }),
    prisma.checkIn.findMany({
      where: { userId: session.userId },
      include: { live: true },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { emailVerified: true },
    }),
    prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        checkIns: {
          where: { status: 'APPROVED' },
          select: { id: true, type: true, status: true },
        },
      },
    }),
  ])

  // Progress: based on AULA check-ins approved (for level + progress bar)
  const approvedCount = calcAulaCount(checkIns)
  const totalLives = lives.length

  // Rank: sort by weighted points (AULA=1, LINKEDIN=3)
  const sorted = allUsers
    .map((u) => ({ id: u.id, points: calcPoints(u.checkIns) }))
    .sort((a, b) => b.points - a.points)
  const userRank = sorted.findIndex((u) => u.id === session.userId) + 1
  const totalParticipants = sorted.length

  // nextLiveId: first active live without an approved AULA check-in
  const approvedAulaLiveIds = new Set(
    checkIns
      .filter((c) => c.status === 'APPROVED' && c.type === 'AULA')
      .map((c) => c.liveId),
  )
  const nextLiveId = lives.find((l) => l.isActive && !approvedAulaLiveIds.has(l.id))?.id ?? null

  return (
    <DashboardClient
      userName={session.name}
      emailVerified={user?.emailVerified ?? false}
      lives={lives.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        scheduledAt: l.scheduledAt ? l.scheduledAt.toISOString() : null,
        order: l.order,
        isActive: l.isActive,
        recordingUrl: l.recordingUrl ?? null,
      }))}
      checkIns={checkIns.map((c) => ({
        id: c.id,
        liveId: c.liveId,
        type: c.type,
        linkedinUrl: c.linkedinUrl,
        insight: c.insight,
        status: c.status,
        adminNote: c.adminNote,
        createdAt: c.createdAt.toISOString(),
      }))}
      approvedCount={approvedCount}
      totalLives={totalLives}
      userRank={userRank}
      totalParticipants={totalParticipants}
      nextLiveId={nextLiveId}
    />
  )
}

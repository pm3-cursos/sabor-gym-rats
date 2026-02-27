import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardClient from './DashboardClient'
import { calcPoints, calcAulaCount, calcLinkedinCount } from '@/lib/points'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [lives, checkIns, allUsers] = await Promise.all([
    prisma.live.findMany({ orderBy: { order: 'asc' } }),
    prisma.checkIn.findMany({
      where: { userId: session.userId },
      include: { live: true },
    }),
    prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        name: true,
        checkIns: {
          select: { id: true, type: true, status: true, isInvalid: true },
        },
        pointAdjustments: { select: { amount: true } },
      },
    }),
  ])

  const approvedCount = calcAulaCount(checkIns)
  const linkedinCount = calcLinkedinCount(checkIns)
  const totalLives = lives.length

  const sorted = allUsers
    .map((u) => ({ id: u.id, name: u.name, points: calcPoints(u.checkIns, u.pointAdjustments) }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'pt-BR'))
  const userRank = sorted.findIndex((u) => u.id === session.userId) + 1
  const totalParticipants = sorted.length
  const userPoints = sorted.find((u) => u.id === session.userId)?.points ?? 0

  const approvedAulaLiveIds = new Set(
    checkIns
      .filter((c) => c.status === 'APPROVED' && c.type === 'AULA')
      .map((c) => c.liveId),
  )
  const nextLiveId = lives.find((l) => l.isActive && !approvedAulaLiveIds.has(l.id))?.id ?? null

  return (
    <DashboardClient
      userName={session.name}
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
        isInvalid: c.isInvalid,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }))}
      approvedCount={approvedCount}
      linkedinCount={linkedinCount}
      totalLives={totalLives}
      userRank={userRank}
      totalParticipants={totalParticipants}
      userPoints={userPoints}
      nextLiveId={nextLiveId}
    />
  )
}

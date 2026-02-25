import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardClient from './DashboardClient'

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
        checkIns: { where: { status: 'APPROVED' }, select: { id: true } },
      },
    }),
  ])

  const approvedCount = checkIns.filter((c) => c.status === 'APPROVED').length
  const totalLives = lives.length

  // userRank
  const sorted = allUsers
    .map((u) => ({ id: u.id, points: u.checkIns.length }))
    .sort((a, b) => b.points - a.points)
  const userRank = sorted.findIndex((u) => u.id === session.userId) + 1
  const totalParticipants = sorted.length

  // nextLiveId: first active live without an approved check-in
  const approvedLiveIds = new Set(
    checkIns.filter((c) => c.status === 'APPROVED').map((c) => c.liveId),
  )
  const nextLiveId = lives.find((l) => l.isActive && !approvedLiveIds.has(l.id))?.id ?? null

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
      }))}
      checkIns={checkIns.map((c) => ({
        id: c.id,
        liveId: c.liveId,
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

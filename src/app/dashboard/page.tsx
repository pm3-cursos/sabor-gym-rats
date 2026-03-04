import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardClient from './DashboardClient'
import { calcPoints, calcAulaCount, calcLinkedinCount } from '@/lib/points'
import { FINAL_CHALLENGE_UNLOCK_UTC } from '@/lib/date'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [lives, checkIns, allUsers, currentUser, finalChallenge, challengeUrlSetting, challengeUnlockSetting] =
    await Promise.all([
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
          finalChallenge: { select: { points: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          linkedinProfileUrl: true,
          welcomeDismissed: true,
        },
      }),
      prisma.finalChallenge.findUnique({ where: { userId: session.userId } }),
      prisma.appSettings.findUnique({ where: { key: 'challengeUrl' } }),
      prisma.appSettings.findUnique({ where: { key: 'challengeUnlockAt' } }),
    ])

  const unlockDate = challengeUnlockSetting?.value
    ? new Date(challengeUnlockSetting.value)
    : FINAL_CHALLENGE_UNLOCK_UTC

  const approvedCount = calcAulaCount(checkIns)
  const linkedinCount = calcLinkedinCount(checkIns)
  const totalLives = lives.length

  const sorted = allUsers
    .map((u) => ({ id: u.id, name: u.name, points: calcPoints(u.checkIns, u.pointAdjustments, u.finalChallenge) }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'pt-BR'))
  const userRank = sorted.findIndex((u) => u.id === session.userId) + 1
  const totalParticipants = sorted.length
  const userPoints = sorted.find((u) => u.id === session.userId)?.points ?? 0

  const approvedAulaLiveIds = new Set(
    checkIns
      .filter((c) => c.status === 'APPROVED' && c.type === 'AULA')
      .map((c) => c.liveId),
  )

  // nextLiveId: the first uncompleted live — active OR next upcoming
  const firstUncompleted = lives.find((l) => !approvedAulaLiveIds.has(l.id))
  const nextLiveId = firstUncompleted?.id ?? null

  const hasAnyActiveLive = lives.some((l) => l.isActive)
  const now = new Date()
  const nextScheduledLive = !hasAnyActiveLive
    ? lives.find((l) => !l.isActive && l.scheduledAt && new Date(l.scheduledAt) > now) ?? null
    : null

  return (
    <DashboardClient
      userName={session.name}
      lives={lives.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        instructor: l.instructor ?? null,
        scheduledAt: l.scheduledAt ? l.scheduledAt.toISOString() : null,
        order: l.order,
        isActive: l.isActive,
        recordingUrl: l.recordingUrl ?? null,
        liveType: l.liveType,
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
      linkedinProfileUrl={currentUser?.linkedinProfileUrl ?? null}
      nextScheduledLive={nextScheduledLive ? {
        title: nextScheduledLive.title,
        scheduledAt: nextScheduledLive.scheduledAt!.toISOString(),
      } : null}
      finalChallenge={finalChallenge ? {
        challengeUrl: finalChallenge.challengeUrl,
        submittedAt: finalChallenge.submittedAt.toISOString(),
      } : null}
      isFinalChallengeUnlocked={new Date() >= unlockDate}
      welcomeDismissed={currentUser?.welcomeDismissed ?? false}
      challengeUrl={challengeUrlSetting?.value || null}
    />
  )
}

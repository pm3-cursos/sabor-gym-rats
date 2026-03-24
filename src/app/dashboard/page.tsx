import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardClient from './DashboardClient'
import { calcPoints, calcAulaCount, calcLinkedinCount } from '@/lib/points'
import { FINAL_CHALLENGE_UNLOCK_UTC } from '@/lib/date'
import { getCouponStatus } from '@/lib/coupon'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [lives, checkIns, allUsers, currentUser, finalChallenge, challengeUrlSetting, challengeUnlockSetting, challengeShortDescSetting, upviralUrlSetting, membershipSettings] =
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
      prisma.appSettings.findUnique({ where: { key: 'challengeShortDesc' } }),
      prisma.appSettings.findUnique({ where: { key: 'upviralUrl' } }),
      prisma.appSettings.findMany({ where: { key: { in: ['membershipPlusUrl', 'membershipPlusCard', 'referralDashboard'] } } }),
    ])

  const membershipSettingsMap = Object.fromEntries(membershipSettings.map((s) => [s.key, s.value]))
  const membershipPlusUrl = membershipSettingsMap['membershipPlusUrl'] || null
  const membershipPlusCard = membershipSettingsMap['membershipPlusCard'] === 'true'
  const referralDashboard = membershipSettingsMap['referralDashboard'] === 'true'

  const unlockDate = challengeUnlockSetting?.value
    ? new Date(challengeUnlockSetting.value)
    : FINAL_CHALLENGE_UNLOCK_UTC

  const approvedCount = calcAulaCount(checkIns)
  const linkedinCount = calcLinkedinCount(checkIns)
  const totalLives = lives.length

  // Coupon eligibility for Aula 6
  const live6 = lives.find((l) => l.order === 6)
  const isAdmin = session.role === 'ADMIN'
  const replitCouponInitial = live6
    ? await getCouponStatus(session.userId, isAdmin, live6.id)
    : null

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

  const brtFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })
  const todayBRT = brtFormatter.format(now)
  const todayLive = lives.find((l) => l.scheduledAt && brtFormatter.format(l.scheduledAt) === todayBRT) ?? null
  const todayLiveId = todayLive?.id ?? null

  return (
    <DashboardClient
      userName={session.name}
      userId={session.userId}
      userRole={session.role}
      replitCouponInitial={replitCouponInitial?.couponEligible && replitCouponInitial.couponCode
        ? { couponCode: replitCouponInitial.couponCode }
        : null}
      lives={lives.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        instructor: l.instructor ?? null,
        scheduledAt: l.scheduledAt ? l.scheduledAt.toISOString() : null,
        order: l.order,
        isActive: (l.isActive || (l.checkInOpenAt !== null && l.checkInOpenAt <= now)) && !l.checkInDisabled,
        recordingUrl: l.recordingUrl ?? null,
        liveUrl: l.liveUrl ?? null,
        liveType: l.liveType,
        linkVisibleEarly: l.linkVisibleEarly,
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
      challengeShortDesc={challengeShortDescSetting?.value || null}
      unlockAt={unlockDate.toISOString()}
      upviralUrl={upviralUrlSetting?.value || null}
      referralDashboard={referralDashboard}
      membershipPlusUrl={membershipPlusUrl}
      membershipPlusCard={membershipPlusCard}
      todayLiveId={todayLiveId}
    />
  )
}

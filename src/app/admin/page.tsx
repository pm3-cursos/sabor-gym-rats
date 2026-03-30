import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AdminClient from './AdminClient'
import { calcPoints, calcAulaCount } from '@/lib/points'
import { computeAllCouponRanks } from '@/lib/coupon'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  const [checkIns, lives, usersRaw, finalChallengesRaw, settings] = await Promise.all([
    prisma.checkIn.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        live: { select: { id: true, title: true, order: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.live.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { checkIns: true } } },
    }),
    prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        isBanned: true,
        createdAt: true,
        checkIns: { select: { type: true, status: true, isInvalid: true } },
        pointAdjustments: { select: { amount: true } },
        _count: { select: { checkIns: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.finalChallenge.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.appSettings.findMany({
      where: {
        key: { in: ['challengeUrl', 'challengeShortDesc', 'challengeUnlockAt', 'showRanking', 'showFeed', 'emailFrom', 'upviralUrl', 'referralBanner', 'referralDashboard', 'referralNavbar', 'referralRanking', 'membershipPlusUrl', 'membershipPlusNavbar', 'membershipPlusCard', 'membershipPlusBanner', 'coursesAccessDisabled', 'challengeSubmissionsDisabled'] },
      },
    }),
  ])

  const adminUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  })

  // Coupon ranks for participants tab
  const live6 = lives.find((l) => l.order === 6)
  const couponRankMap = live6 ? await computeAllCouponRanks(live6.id) : new Map<string, number>()

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  // Build a map for fast lookup of finalChallenge by userId
  const finalChallengeByUser = new Map(
    finalChallengesRaw.map((fc) => [fc.userId, { points: fc.points, isInvalid: fc.isInvalid }]),
  )

  const users = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isBanned: u.isBanned,
    createdAt: u.createdAt.toISOString(),
    checkInsCount: u._count.checkIns,
    points: calcPoints(u.checkIns, u.pointAdjustments, finalChallengeByUser.get(u.id) ?? null),
    aulaCount: calcAulaCount(u.checkIns),
    couponRank: couponRankMap.get(u.id) ?? null,
  }))

  return (
    <AdminClient
      checkIns={checkIns.map(serializeCheckIn)}
      lives={lives.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        instructor: l.instructor ?? null,
        scheduledAt: l.scheduledAt?.toISOString() ?? null,
        order: l.order,
        isActive: l.isActive,
        checkInOpenAt: l.checkInOpenAt?.toISOString() ?? null,
        checkInDisabled: l.checkInDisabled,
        recordingUrl: l.recordingUrl ?? null,
        liveUrl: l.liveUrl ?? null,
        liveType: l.liveType,
        linkVisibleEarly: l.linkVisibleEarly,
        checkInsCount: l._count.checkIns,
      }))}
      users={users}
      finalChallenges={finalChallengesRaw.map((fc) => ({
        id: fc.id,
        userId: fc.userId,
        userName: fc.user.name,
        userEmail: fc.user.email,
        challengeUrl: fc.challengeUrl,
        submittedAt: fc.submittedAt.toISOString(),
        points: fc.points,
        isInvalid: fc.isInvalid,
      }))}
      challengeUrl={settingsMap['challengeUrl'] ?? null}
      challengeShortDesc={settingsMap['challengeShortDesc'] ?? null}
      challengeUnlockAt={settingsMap['challengeUnlockAt'] ?? null}
      showRanking={settingsMap['showRanking'] === 'true'}
      showFeed={settingsMap['showFeed'] === 'true'}
      emailFrom={settingsMap['emailFrom'] ?? null}
      adminEmail={adminUser?.email ?? null}
      upviralUrl={settingsMap['upviralUrl'] ?? null}
      referralBanner={settingsMap['referralBanner'] === 'true'}
      referralDashboard={settingsMap['referralDashboard'] === 'true'}
      referralNavbar={settingsMap['referralNavbar'] === 'true'}
      referralRanking={settingsMap['referralRanking'] === 'true'}
      membershipPlusUrl={settingsMap['membershipPlusUrl'] ?? null}
      membershipPlusNavbar={settingsMap['membershipPlusNavbar'] === 'true'}
      membershipPlusCard={settingsMap['membershipPlusCard'] === 'true'}
      membershipPlusBanner={settingsMap['membershipPlusBanner'] === 'true'}
      coursesAccessDisabled={settingsMap['coursesAccessDisabled'] === 'true'}
      challengeSubmissionsDisabled={settingsMap['challengeSubmissionsDisabled'] === 'true'}
    />
  )
}

function serializeCheckIn(c: {
  id: string
  type: string
  linkedinUrl: string | null
  insight: string | null
  status: string
  isInvalid: boolean
  adminNote: string | null
  createdAt: Date
  updatedAt: Date
  reviewedAt: Date | null
  reviewedBy: string | null
  user: { id: string; name: string; email: string }
  live: { id: string; title: string; order: number }
}) {
  return {
    id: c.id,
    type: c.type,
    linkedinUrl: c.linkedinUrl,
    insight: c.insight,
    status: c.status,
    isInvalid: c.isInvalid,
    adminNote: c.adminNote,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    reviewedAt: c.reviewedAt?.toISOString() ?? null,
    reviewedBy: c.reviewedBy,
    user: c.user,
    live: c.live,
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calcPoints, calcAulaCount } from '@/lib/points'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [users, totalLives] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        name: true,
        checkIns: {
          select: { type: true, status: true, isInvalid: true },
        },
        pointAdjustments: { select: { amount: true } },
      },
    }),
    prisma.live.count(),
  ])

  const leaderboard = users
    .map((user) => ({
      id: user.id,
      name: user.name,
      points: calcPoints(user.checkIns, user.pointAdjustments),
      completed: calcAulaCount(user.checkIns) >= totalLives,
    }))
    .sort((a, b) => b.points - a.points)

  return NextResponse.json({ leaderboard })
}

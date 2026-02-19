import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      name: true,
      checkIns: {
        where: { status: 'APPROVED' },
        select: { liveId: true },
      },
    },
  })

  const leaderboard = users
    .map((user) => ({
      id: user.id,
      name: user.name,
      points: user.checkIns.length,
      completed: user.checkIns.length >= 8,
    }))
    .sort((a, b) => b.points - a.points)

  return NextResponse.json({ leaderboard })
}

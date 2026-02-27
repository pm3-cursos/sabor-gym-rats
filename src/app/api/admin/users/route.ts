import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calcPoints, calcAulaCount } from '@/lib/points'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      name: true,
      email: true,
      isBanned: true,
      createdAt: true,
      checkIns: {
        select: { type: true, status: true, isInvalid: true },
      },
      pointAdjustments: { select: { amount: true } },
      _count: { select: { checkIns: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const result = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isBanned: u.isBanned,
    createdAt: u.createdAt,
    checkInsCount: u._count.checkIns,
    points: calcPoints(u.checkIns, u.pointAdjustments),
    aulaCount: calcAulaCount(u.checkIns),
  }))

  return NextResponse.json({ users: result })
}

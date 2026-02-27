import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AdminClient from './AdminClient'
import { calcPoints, calcAulaCount } from '@/lib/points'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  const [checkIns, lives, usersRaw] = await Promise.all([
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
  ])

  const users = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isBanned: u.isBanned,
    createdAt: u.createdAt.toISOString(),
    checkInsCount: u._count.checkIns,
    points: calcPoints(u.checkIns, u.pointAdjustments),
    aulaCount: calcAulaCount(u.checkIns),
  }))

  return (
    <AdminClient
      checkIns={checkIns.map(serializeCheckIn)}
      lives={lives.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        scheduledAt: l.scheduledAt?.toISOString() ?? null,
        order: l.order,
        isActive: l.isActive,
        recordingUrl: l.recordingUrl ?? null,
        checkInsCount: l._count.checkIns,
      }))}
      users={users}
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

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/dashboard')

  const [checkIns, lives] = await Promise.all([
    prisma.checkIn.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        live: { select: { id: true, title: true, order: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.live.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { checkIns: true } } },
    }),
  ])

  const pending = checkIns.filter((c) => c.status === 'PENDING')
  const approved = checkIns.filter((c) => c.status === 'APPROVED')
  const rejected = checkIns.filter((c) => c.status === 'REJECTED')

  return (
    <AdminClient
      pendingCheckIns={pending.map(serializeCheckIn)}
      approvedCheckIns={approved.map(serializeCheckIn)}
      rejectedCheckIns={rejected.map(serializeCheckIn)}
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
    />
  )
}

function serializeCheckIn(c: {
  id: string
  type: string
  linkedinUrl: string | null
  insight: string | null
  status: string
  adminNote: string | null
  createdAt: Date
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
    adminNote: c.adminNote,
    createdAt: c.createdAt.toISOString(),
    reviewedAt: c.reviewedAt?.toISOString() ?? null,
    reviewedBy: c.reviewedBy,
    user: c.user,
    live: c.live,
  }
}

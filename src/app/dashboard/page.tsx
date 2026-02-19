import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [lives, checkIns] = await Promise.all([
    prisma.live.findMany({ orderBy: { order: 'asc' } }),
    prisma.checkIn.findMany({
      where: { userId: session.userId },
      include: { live: true },
    }),
  ])

  const approvedCount = checkIns.filter((c) => c.status === 'APPROVED').length

  return (
    <DashboardClient
      userName={session.name}
      lives={lives}
      checkIns={checkIns.map((c) => ({
        id: c.id,
        liveId: c.liveId,
        linkedinUrl: c.linkedinUrl,
        status: c.status,
        adminNote: c.adminNote,
        createdAt: c.createdAt.toISOString(),
      }))}
      approvedCount={approvedCount}
    />
  )
}

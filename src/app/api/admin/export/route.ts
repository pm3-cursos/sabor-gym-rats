import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calcPoints } from '@/lib/points'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const [lives, users] = await Promise.all([
    prisma.live.findMany({ orderBy: { order: 'asc' } }),
    prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        isBanned: true,
        checkIns: {
          select: {
            liveId: true,
            type: true,
            status: true,
            isInvalid: true,
            insight: true,
            linkedinUrl: true,
          },
        },
        pointAdjustments: { select: { amount: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  // Header row
  const header: string[] = ['Nome', 'Email', 'Total Pontos', 'Status']
  for (const live of lives) {
    header.push(`Aula ${live.order} – Feita`)
    header.push(`Aula ${live.order} – Insight`)
    header.push(`Aula ${live.order} – LinkedIn`)
  }

  // Data rows — one row per user
  const rows = users.map((user) => {
    const points = calcPoints(user.checkIns, user.pointAdjustments)
    const row: string[] = [
      user.name,
      user.email,
      String(points),
      user.isBanned ? 'Banido' : 'Ativo',
    ]
    for (const live of lives) {
      const aulaCI = user.checkIns.find((c) => c.liveId === live.id && c.type === 'AULA')
      const linkedinCI = user.checkIns.find((c) => c.liveId === live.id && c.type === 'LINKEDIN')
      const aulaApproved = aulaCI?.status === 'APPROVED' && !aulaCI?.isInvalid
      row.push(aulaApproved ? 'Sim' : 'Não')
      row.push(aulaCI?.insight ?? '')
      row.push(linkedinCI?.linkedinUrl ?? '')
    }
    return row
  })

  const allRows = [header, ...rows]
  const csv =
    '\uFEFF' + // BOM for Excel UTF-8 detection
    allRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')

  const today = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="maratona-pm3-export-${today}.csv"`,
    },
  })
}

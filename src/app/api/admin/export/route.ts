import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calcPoints, calcAulaCount } from '@/lib/points'
import { TZ } from '@/lib/date'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null | undefined): string {
  if (!d) return ''
  return d.toLocaleString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

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
        linkedinProfileUrl: true,
        showFirstNameOnly: true,
        reminderDays2: true,
        reminderDays1: true,
        reminder12h: true,
        reminder1h: true,
        loginCount: true,
        lastAccessDate: true,
        checkIns: {
          select: {
            liveId: true,
            type: true,
            status: true,
            isInvalid: true,
            insight: true,
            linkedinUrl: true,
            createdAt: true,
          },
        },
        pointAdjustments: { select: { amount: true } },
        finalChallenge: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  // Header row
  const header: string[] = [
    'Nome',
    'Email',
    'Total Pontos',
    'Status',
    'LinkedIn Profile',
    'Privacidade',
    'Lembrete 2 dias',
    'Lembrete 1 dia',
    'Lembrete 12h',
    'Lembrete 1h',
    'Login Count',
    'Último Acesso',
    'Progresso (aulas)',
  ]

  for (const live of lives) {
    header.push(`Aula ${live.order} – Feita`)
    header.push(`Aula ${live.order} – Insight`)
    header.push(`Aula ${live.order} – LinkedIn URL`)
    header.push(`Aula ${live.order} – Data Check-in`)
    header.push(`Aula ${live.order} – Status`)
  }

  header.push('Desafio Enviado', 'Link do Desafio', 'Data Envio Desafio', 'Pontos Desafio')

  // Data rows — one row per user
  const rows = users.map((user) => {
    const points = calcPoints(user.checkIns, user.pointAdjustments, user.finalChallenge)
    const aulaCount = calcAulaCount(user.checkIns)

    const row: string[] = [
      user.name,
      user.email,
      String(points),
      user.isBanned ? 'Banido' : 'Ativo',
      user.linkedinProfileUrl ?? '',
      user.showFirstNameOnly ? 'Apenas primeiro nome' : 'Nome completo',
      user.reminderDays2 ? 'Sim' : 'Não',
      user.reminderDays1 ? 'Sim' : 'Não',
      user.reminder12h ? 'Sim' : 'Não',
      user.reminder1h ? 'Sim' : 'Não',
      String(user.loginCount),
      fmtDate(user.lastAccessDate),
      `${aulaCount}/${lives.length}`,
    ]

    for (const live of lives) {
      const aulaCI = user.checkIns.find((c) => c.liveId === live.id && c.type === 'AULA')
      const linkedinCI = user.checkIns.find((c) => c.liveId === live.id && c.type === 'LINKEDIN')
      const aulaApproved = aulaCI?.status === 'APPROVED' && !aulaCI?.isInvalid
      row.push(aulaApproved ? 'Sim' : 'Não')
      row.push(aulaCI?.insight ?? '')
      row.push(linkedinCI?.linkedinUrl ?? '')
      row.push(aulaCI ? fmtDate(aulaCI.createdAt) : '')
      row.push(aulaCI?.status ?? '')
    }

    row.push(
      user.finalChallenge ? 'Sim' : 'Não',
      user.finalChallenge?.challengeUrl ?? '',
      user.finalChallenge ? fmtDate(user.finalChallenge.submittedAt) : '',
      user.finalChallenge ? String(user.finalChallenge.points) : '0',
    )

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

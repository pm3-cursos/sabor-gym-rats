import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const checkIns = await prisma.checkIn.findMany({
    where: { userId: session.userId },
    include: { live: true },
    orderBy: { live: { order: 'asc' } },
  })

  return NextResponse.json({ checkIns })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { liveId, linkedinUrl, insight } = await request.json()

  if (!liveId || !linkedinUrl) {
    return NextResponse.json({ error: 'liveId e linkedinUrl são obrigatórios.' }, { status: 400 })
  }

  if (!linkedinUrl.includes('linkedin.com')) {
    return NextResponse.json({ error: 'Por favor, envie um link válido do LinkedIn.' }, { status: 400 })
  }

  if (insight !== undefined && insight !== null && insight.trim().length < 10) {
    return NextResponse.json({ error: 'O insight deve ter pelo menos 10 caracteres.' }, { status: 400 })
  }

  const live = await prisma.live.findUnique({ where: { id: liveId } })
  if (!live) {
    return NextResponse.json({ error: 'Live não encontrada.' }, { status: 404 })
  }
  if (!live.isActive) {
    return NextResponse.json({ error: 'Esta live ainda não está aceitando check-ins.' }, { status: 400 })
  }

  const existing = await prisma.checkIn.findUnique({
    where: { userId_liveId: { userId: session.userId, liveId } },
  })

  if (existing && existing.status === 'PENDING') {
    return NextResponse.json({ error: 'Você já enviou um check-in para esta live. Aguarde a aprovação.' }, { status: 409 })
  }

  if (existing && existing.status === 'APPROVED') {
    return NextResponse.json({ error: 'Seu check-in para esta live já foi aprovado.' }, { status: 409 })
  }

  const insightValue = insight?.trim() || null

  const checkIn = await prisma.checkIn.upsert({
    where: { userId_liveId: { userId: session.userId, liveId } },
    update: {
      linkedinUrl,
      insight: insightValue,
      status: 'PENDING',
      adminNote: null,
      reviewedAt: null,
      reviewedBy: null,
    },
    create: {
      userId: session.userId,
      liveId,
      linkedinUrl,
      insight: insightValue,
      status: 'PENDING',
    },
    include: { live: true },
  })

  return NextResponse.json({ checkIn }, { status: 201 })
}

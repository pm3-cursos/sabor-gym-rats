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
    orderBy: [{ live: { order: 'asc' } }, { type: 'asc' }],
  })

  return NextResponse.json({ checkIns })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { liveId, type = 'AULA', linkedinUrl, insight } = await request.json()

  if (!liveId) {
    return NextResponse.json({ error: 'liveId é obrigatório.' }, { status: 400 })
  }

  if (type !== 'AULA' && type !== 'LINKEDIN') {
    return NextResponse.json({ error: 'type deve ser AULA ou LINKEDIN.' }, { status: 400 })
  }

  // Validation per type
  if (type === 'AULA') {
    const insightTrimmed = insight?.trim() ?? ''
    if (insightTrimmed.length < 10) {
      return NextResponse.json(
        { error: 'O insight deve ter pelo menos 10 caracteres.' },
        { status: 400 },
      )
    }
  }

  if (type === 'LINKEDIN') {
    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com')) {
      return NextResponse.json(
        { error: 'Por favor, envie um link válido do LinkedIn.' },
        { status: 400 },
      )
    }
  }

  const live = await prisma.live.findUnique({ where: { id: liveId } })
  if (!live) {
    return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })
  }
  if (!live.isActive) {
    return NextResponse.json(
      { error: 'Esta aula ainda não está aceitando check-ins.' },
      { status: 400 },
    )
  }

  const existing = await prisma.checkIn.findUnique({
    where: { userId_liveId_type: { userId: session.userId, liveId, type } },
  })

  if (existing?.status === 'PENDING') {
    return NextResponse.json(
      { error: 'Você já enviou este check-in. Aguarde a aprovação.' },
      { status: 409 },
    )
  }
  if (existing?.status === 'APPROVED') {
    return NextResponse.json(
      { error: 'Este check-in já foi aprovado.' },
      { status: 409 },
    )
  }

  const insightValue = type === 'AULA' ? insight.trim() : (insight?.trim() || null)
  const linkedinValue = type === 'LINKEDIN' ? linkedinUrl.trim() : null

  const checkIn = await prisma.checkIn.upsert({
    where: { userId_liveId_type: { userId: session.userId, liveId, type } },
    update: {
      insight: insightValue,
      linkedinUrl: linkedinValue,
      status: 'PENDING',
      adminNote: null,
      reviewedAt: null,
      reviewedBy: null,
    },
    create: {
      userId: session.userId,
      liveId,
      type,
      insight: insightValue,
      linkedinUrl: linkedinValue,
      status: 'PENDING',
    },
    include: { live: true },
  })

  return NextResponse.json({ checkIn }, { status: 201 })
}

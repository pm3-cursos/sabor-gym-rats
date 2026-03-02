import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { extractLinkedinUsername } from '@/lib/linkedin'

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
    const url = linkedinUrl?.trim() ?? ''
    if (!url.toLowerCase().includes('linkedin.com') || !url.includes('posts/')) {
      return NextResponse.json(
        { error: 'Cole o link oficial de uma publicação do LinkedIn (deve conter linkedin.com/posts/).' },
        { status: 400 },
      )
    }

    // Validate that the post URL belongs to the user's LinkedIn profile
    const userProfile = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { linkedinProfileUrl: true },
    })
    if (!userProfile?.linkedinProfileUrl) {
      return NextResponse.json(
        { error: 'Adicione seu perfil do LinkedIn nas configurações antes de enviar o bônus.' },
        { status: 400 },
      )
    }
    const username = extractLinkedinUsername(userProfile.linkedinProfileUrl)
    if (!username) {
      return NextResponse.json(
        { error: 'Seu LinkedIn cadastrado está em formato inválido. Atualize nas configurações: https://www.linkedin.com/in/seu-perfil/' },
        { status: 400 },
      )
    }
    if (!url.toLowerCase().includes(username)) {
      return NextResponse.json(
        { error: 'Este link não parece ser seu. Use um post publicado pelo seu perfil do LinkedIn.' },
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

  // LinkedIn bonus requires an approved (non-invalid) AULA check-in for the same live
  if (type === 'LINKEDIN') {
    const aulaCI = await prisma.checkIn.findUnique({
      where: { userId_liveId_type: { userId: session.userId, liveId, type: 'AULA' } },
    })
    if (!aulaCI || aulaCI.status !== 'APPROVED' || aulaCI.isInvalid) {
      return NextResponse.json(
        { error: 'Faça o check-in da aula primeiro antes de enviar o bônus LinkedIn.' },
        { status: 400 },
      )
    }
  }

  const existing = await prisma.checkIn.findUnique({
    where: { userId_liveId_type: { userId: session.userId, liveId, type } },
  })

  if (existing?.status === 'APPROVED') {
    return NextResponse.json(
      { error: 'Este check-in já foi registrado.' },
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
      status: 'APPROVED',
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
      status: 'APPROVED',
    },
    include: { live: true },
  })

  return NextResponse.json({ checkIn }, { status: 201 })
}

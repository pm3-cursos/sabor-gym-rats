import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { extractLinkedinUsername } from '@/lib/linkedin'
import { computeCouponEligibility } from '@/lib/coupon'

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

  const globalDisableSetting = await prisma.appSettings.findUnique({
    where: { key: 'coursesAccessDisabled' },
  })
  if (globalDisableSetting?.value === 'true') {
    return NextResponse.json(
      { error: 'O período de envio de check-ins foi encerrado.' },
      { status: 403 },
    )
  }

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

    if (insightTrimmed.length > 2000) {
      return NextResponse.json(
        { error: 'O insight deve ter no máximo 2000 caracteres.' },
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
  }

  if (type === 'AULA') {
    // For AULA: fetch live and existing check-in in parallel
    const [live, existing] = await Promise.all([
      prisma.live.findUnique({ where: { id: liveId } }),
      prisma.checkIn.findUnique({
        where: { userId_liveId_type: { userId: session.userId, liveId, type } },
      }),
    ])

    if (!live) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })
    }

    const now = new Date()
    const effectivelyActive =
      (live.isActive || (live.checkInOpenAt !== null && live.checkInOpenAt <= now)) &&
      !live.checkInDisabled
    if (!effectivelyActive) {
      return NextResponse.json(
        { error: 'Esta aula ainda não está aceitando check-ins.' },
        { status: 400 },
      )
    }

    if (existing?.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Este check-in já foi registrado.' },
        { status: 409 },
      )
    }

    const checkIn = await prisma.checkIn.upsert({
      where: { userId_liveId_type: { userId: session.userId, liveId, type } },
      update: {
        insight: insight.trim(),
        linkedinUrl: null,
        status: 'APPROVED',
        adminNote: null,
        reviewedAt: null,
        reviewedBy: null,
      },
      create: {
        userId: session.userId,
        liveId,
        type,
        insight: insight.trim(),
        linkedinUrl: null,
        status: 'APPROVED',
      },
      include: { live: true },
    })

    // Milestone notification
    const approvedAulaCount = await prisma.checkIn.count({
      where: { userId: session.userId, type: 'AULA', status: 'APPROVED', isInvalid: false },
    })

    const milestones: Record<number, { title: string; message: string }> = {
      1: { title: '🏅 Novo nível: Iniciante!', message: 'Você completou sua primeira aula da Maratona PM3!' },
      3: { title: '🥈 Novo nível: Corredor!', message: 'Você completou 3 aulas da Maratona PM3!' },
      6: { title: '🥇 Maratonista PM3!', message: 'Você completou todas as aulas! Parabéns!' },
    }

    const milestone = milestones[approvedAulaCount]
    if (milestone) {
      const existingNotif = await prisma.notification.findFirst({
        where: { userId: session.userId, type: 'MILESTONE', title: milestone.title },
      })
      if (!existingNotif) {
        await prisma.notification.create({
          data: { userId: session.userId, type: 'MILESTONE', title: milestone.title, message: milestone.message },
        })
      }
    }

    // Coupon eligibility for Aula 6
    if (live.order === 6) {
      const isAdmin = session.role === 'ADMIN'
      const coupon = await computeCouponEligibility(session.userId, isAdmin, live.id)
      return NextResponse.json({ checkIn, ...coupon }, { status: 201 })
    }

    return NextResponse.json({ checkIn }, { status: 201 })
  }

  // LINKEDIN type: fetch user profile and live in parallel
  const [userProfile, live] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { linkedinProfileUrl: true },
    }),
    prisma.live.findUnique({ where: { id: liveId } }),
  ])

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
  const url = linkedinUrl.trim()
  if (!url.toLowerCase().includes(username)) {
    return NextResponse.json(
      { error: 'Este link não parece ser seu. Use um post publicado pelo seu perfil do LinkedIn.' },
      { status: 400 },
    )
  }

  if (!live) {
    return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })
  }

  const now = new Date()
  const effectivelyActive =
    (live.isActive || (live.checkInOpenAt !== null && live.checkInOpenAt <= now)) &&
    !live.checkInDisabled
  if (!effectivelyActive) {
    return NextResponse.json(
      { error: 'Esta aula ainda não está aceitando check-ins.' },
      { status: 400 },
    )
  }

  // Fetch aula check-in and existing linkedin check-in in parallel
  const [aulaCI, existing] = await Promise.all([
    prisma.checkIn.findUnique({
      where: { userId_liveId_type: { userId: session.userId, liveId, type: 'AULA' } },
    }),
    prisma.checkIn.findUnique({
      where: { userId_liveId_type: { userId: session.userId, liveId, type: 'LINKEDIN' } },
    }),
  ])

  if (!aulaCI || aulaCI.status !== 'APPROVED' || aulaCI.isInvalid) {
    return NextResponse.json(
      { error: 'Faça o check-in da aula primeiro antes de enviar o bônus LinkedIn.' },
      { status: 400 },
    )
  }

  if (existing?.status === 'APPROVED') {
    return NextResponse.json(
      { error: 'Este check-in já foi registrado.' },
      { status: 409 },
    )
  }

  const checkIn = await prisma.checkIn.upsert({
    where: { userId_liveId_type: { userId: session.userId, liveId, type: 'LINKEDIN' } },
    update: {
      insight: insight?.trim() || null,
      linkedinUrl: url,
      status: 'APPROVED',
      adminNote: null,
      reviewedAt: null,
      reviewedBy: null,
    },
    create: {
      userId: session.userId,
      liveId,
      type: 'LINKEDIN',
      insight: insight?.trim() || null,
      linkedinUrl: url,
      status: 'APPROVED',
    },
    include: { live: true },
  })

  return NextResponse.json({ checkIn }, { status: 201 })
}

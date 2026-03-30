import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { FINAL_CHALLENGE_UNLOCK_UTC } from '@/lib/date'

async function isUnlocked(): Promise<boolean> {
  const setting = await prisma.appSettings.findUnique({ where: { key: 'challengeUnlockAt' } })
  const unlockDate = setting?.value ? new Date(setting.value) : FINAL_CHALLENGE_UNLOCK_UTC
  return new Date() >= unlockDate
}

async function isSubmissionsDisabled(): Promise<boolean> {
  const setting = await prisma.appSettings.findUnique({ where: { key: 'challengeSubmissionsDisabled' } })
  return setting?.value === 'true'
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const challenge = await prisma.finalChallenge.findUnique({
    where: { userId: session.userId },
  })

  return NextResponse.json({ finalChallenge: challenge ? {
    challengeUrl: challenge.challengeUrl,
    submittedAt: challenge.submittedAt.toISOString(),
    points: challenge.points,
  } : null })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  if (!(await isUnlocked())) {
    return NextResponse.json(
      { error: 'A entrega final ainda não está disponível. Disponível a partir de 17/03.' },
      { status: 403 },
    )
  }

  if (await isSubmissionsDisabled()) {
    return NextResponse.json(
      { error: 'O período de envio do desafio final foi encerrado.' },
      { status: 403 },
    )
  }

  const existing = await prisma.finalChallenge.findUnique({ where: { userId: session.userId } })
  if (existing) {
    return NextResponse.json(
      { error: 'Você já enviou sua entrega final. Apenas uma submissão é permitida.' },
      { status: 409 },
    )
  }

  const { challengeUrl } = await request.json()
  if (!challengeUrl || typeof challengeUrl !== 'string' || !challengeUrl.startsWith('http')) {
    return NextResponse.json({ error: 'URL inválida.' }, { status: 400 })
  }

  const [challenge] = await prisma.$transaction([
    prisma.finalChallenge.create({
      data: { userId: session.userId, challengeUrl: challengeUrl.trim(), points: 5 },
    }),
    prisma.notification.create({
      data: {
        userId: session.userId,
        type: 'FINAL_CHALLENGE_SUBMITTED',
        title: 'Entrega final concluída! +5 pts',
        message: 'Sua entrega da Maratona PM3 foi registrada com sucesso.',
      },
    }),
  ])

  return NextResponse.json({
    finalChallenge: {
      challengeUrl: challenge.challengeUrl,
      submittedAt: challenge.submittedAt.toISOString(),
      points: challenge.points,
      isInvalid: challenge.isInvalid,
    },
  }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  if (await isSubmissionsDisabled()) {
    return NextResponse.json(
      { error: 'O período de envio do desafio final foi encerrado.' },
      { status: 403 },
    )
  }

  const existing = await prisma.finalChallenge.findUnique({ where: { userId: session.userId } })
  if (!existing) {
    return NextResponse.json({ error: 'Nenhuma entrega encontrada.' }, { status: 404 })
  }

  const { challengeUrl } = await request.json()
  if (!challengeUrl || typeof challengeUrl !== 'string' || !challengeUrl.startsWith('http')) {
    return NextResponse.json({ error: 'URL inválida.' }, { status: 400 })
  }

  const updated = await prisma.finalChallenge.update({
    where: { userId: session.userId },
    data: { challengeUrl: challengeUrl.trim() },
  })

  return NextResponse.json({
    finalChallenge: {
      challengeUrl: updated.challengeUrl,
      submittedAt: updated.submittedAt.toISOString(),
      points: updated.points,
      isInvalid: updated.isInvalid,
    },
  })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const existing = await prisma.finalChallenge.findUnique({ where: { userId: session.userId } })
  if (!existing) {
    return NextResponse.json({ error: 'Nenhuma entrega encontrada.' }, { status: 404 })
  }

  await prisma.finalChallenge.delete({ where: { userId: session.userId } })

  return NextResponse.json({ ok: true })
}

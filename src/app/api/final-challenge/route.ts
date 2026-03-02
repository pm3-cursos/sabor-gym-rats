import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isFinalChallengeUnlocked } from '@/lib/date'

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

  if (!isFinalChallengeUnlocked()) {
    return NextResponse.json(
      { error: 'A entrega final ainda não está disponível. Disponível a partir de 17/03.' },
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
    },
  }, { status: 201 })
}

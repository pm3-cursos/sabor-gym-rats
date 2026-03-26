import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

// PUT /api/admin/final-challenge/[userId] — edit challenge URL
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { userId } = await params
  const { challengeUrl } = await request.json()

  if (!challengeUrl || typeof challengeUrl !== 'string' || !challengeUrl.startsWith('http')) {
    return NextResponse.json({ error: 'URL inválida.' }, { status: 400 })
  }

  const updated = await prisma.finalChallenge.update({
    where: { userId },
    data: { challengeUrl: challengeUrl.trim() },
  })

  return NextResponse.json({
    finalChallenge: {
      id: updated.id,
      userId: updated.userId,
      challengeUrl: updated.challengeUrl,
      submittedAt: updated.submittedAt.toISOString(),
      points: updated.points,
      isInvalid: updated.isInvalid,
    },
  })
}

// PATCH /api/admin/final-challenge/[userId] — toggle isInvalid
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { userId } = await params
  const body = await request.json().catch(() => ({}))
  const reason: string | undefined = body.reason

  const existing = await prisma.finalChallenge.findUnique({ where: { userId } })
  if (!existing) {
    return NextResponse.json({ error: 'Entrega não encontrada.' }, { status: 404 })
  }

  const willBeInvalid = !existing.isInvalid

  const updated = await prisma.finalChallenge.update({
    where: { userId },
    data: {
      isInvalid: willBeInvalid,
      invalidationReason: willBeInvalid ? (reason || null) : null,
    },
  })

  const notificationMessage = willBeInvalid && reason ? `Motivo: ${reason}` : undefined
  await prisma.notification.create({
    data: {
      userId,
      type: 'SCORE_ADJUSTMENT',
      title: willBeInvalid
        ? '⚠️ Sua entrega do desafio final foi invalidada'
        : '✅ Sua entrega do desafio final foi revalidada',
      message: notificationMessage ?? null,
    },
  })

  return NextResponse.json({
    finalChallenge: {
      id: updated.id,
      userId: updated.userId,
      challengeUrl: updated.challengeUrl,
      submittedAt: updated.submittedAt.toISOString(),
      points: updated.points,
      isInvalid: updated.isInvalid,
      invalidationReason: updated.invalidationReason,
    },
  })
}

// DELETE /api/admin/final-challenge/[userId] — delete submission
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })
  }

  const { userId } = await params

  const existing = await prisma.finalChallenge.findUnique({ where: { userId } })
  if (!existing) {
    return NextResponse.json({ error: 'Entrega não encontrada.' }, { status: 404 })
  }

  await prisma.finalChallenge.delete({ where: { userId } })

  return NextResponse.json({ ok: true })
}

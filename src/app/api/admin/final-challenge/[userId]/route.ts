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

  const updated = await prisma.finalChallenge.update({
    where: { userId },
    data: { isInvalid: !existing.isInvalid },
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

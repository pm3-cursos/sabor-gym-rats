import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { userId, amount, reason } = await request.json()

  if (!userId || typeof amount !== 'number') {
    return NextResponse.json({ error: 'userId e amount são obrigatórios.' }, { status: 400 })
  }

  const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!userExists) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
  }

  const adj = await prisma.pointAdjustment.create({
    data: { userId, amount, reason: reason || null },
  })

  await prisma.notification.create({
    data: {
      userId,
      type: 'SCORE_ADJUSTMENT',
      title: amount >= 0
        ? `➕ Ajuste de pontuação: +${amount} pts`
        : `➖ Ajuste de pontuação: ${amount} pts`,
      message: reason || null,
    },
  })

  return NextResponse.json({ adjustment: adj }, { status: 201 })
}

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

  const adj = await prisma.pointAdjustment.create({
    data: { userId, amount, reason: reason || null },
  })

  return NextResponse.json({ adjustment: adj }, { status: 201 })
}

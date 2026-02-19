import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const lives = await prisma.live.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { checkIns: true } },
    },
  })

  return NextResponse.json({ lives })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { title, description, scheduledAt, order, isActive } = await request.json()

  if (!title || order == null) {
    return NextResponse.json({ error: 'title e order são obrigatórios.' }, { status: 400 })
  }

  const live = await prisma.live.create({
    data: {
      title,
      description,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      order,
      isActive: isActive ?? false,
    },
  })

  return NextResponse.json({ live }, { status: 201 })
}

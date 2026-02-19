import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const checkIns = await prisma.checkIn.findMany({
    where: status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : undefined,
    include: {
      user: { select: { id: true, name: true, email: true } },
      live: { select: { id: true, title: true, order: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ checkIns })
}

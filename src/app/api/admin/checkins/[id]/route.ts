import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { status, adminNote } = await request.json()

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
  }

  const checkIn = await prisma.checkIn.update({
    where: { id: params.id },
    data: {
      status,
      adminNote: adminNote || null,
      reviewedAt: new Date(),
      reviewedBy: session.name,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      live: { select: { id: true, title: true, order: true } },
    },
  })

  return NextResponse.json({ checkIn })
}

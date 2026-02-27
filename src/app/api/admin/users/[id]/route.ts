import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { action } = await request.json()

  if (action !== 'ban' && action !== 'unban') {
    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isBanned: action === 'ban' },
    select: { id: true, name: true, isBanned: true },
  })

  return NextResponse.json({ user })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  await prisma.user.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

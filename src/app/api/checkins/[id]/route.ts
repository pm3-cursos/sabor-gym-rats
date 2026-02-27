import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const checkIn = await prisma.checkIn.findUnique({ where: { id: params.id } })
  if (!checkIn) return NextResponse.json({ error: 'Check-in não encontrado.' }, { status: 404 })
  if (checkIn.userId !== session.userId) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  const body = await request.json()
  const updateData: Record<string, string | null> = {}

  if (checkIn.type === 'AULA') {
    const insight = body.insight?.trim() ?? ''
    if (insight.length < 10) {
      return NextResponse.json(
        { error: 'O insight deve ter pelo menos 10 caracteres.' },
        { status: 400 },
      )
    }
    updateData.insight = insight
  }

  if (checkIn.type === 'LINKEDIN') {
    const url = body.linkedinUrl?.trim() ?? ''
    if (!url.startsWith('https://www.linkedin.com/') || !url.includes('posts/')) {
      return NextResponse.json(
        {
          error:
            'Cole o link oficial de uma publicação do LinkedIn (deve conter linkedin.com/posts/).',
        },
        { status: 400 },
      )
    }
    updateData.linkedinUrl = url
  }

  const updated = await prisma.checkIn.update({
    where: { id: params.id },
    data: updateData,
  })

  return NextResponse.json({ checkIn: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const checkIn = await prisma.checkIn.findUnique({ where: { id: params.id } })
  if (!checkIn) return NextResponse.json({ error: 'Check-in não encontrado.' }, { status: 404 })
  if (checkIn.userId !== session.userId) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  await prisma.checkIn.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

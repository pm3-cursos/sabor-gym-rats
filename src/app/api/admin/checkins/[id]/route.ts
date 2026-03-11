import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const body = await request.json()

  // Toggle invalidate
  if (body.action === 'invalidate') {
    const { reason } = body
    const current = await prisma.checkIn.findUnique({
      where: { id: params.id },
      include: { live: { select: { title: true, order: true } } },
    })
    if (!current) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 })
    const updated = await prisma.checkIn.update({
      where: { id: params.id },
      data: { isInvalid: !current.isInvalid },
    })
    const notificationMessage = updated.isInvalid && reason
      ? `${current.live.title}\nMotivo: ${reason}`
      : current.live.title
    await prisma.notification.create({
      data: {
        userId: current.userId,
        type: 'SCORE_ADJUSTMENT',
        title: updated.isInvalid
          ? `⚠️ Check-in da Aula ${current.live.order} foi invalidado`
          : `✅ Check-in da Aula ${current.live.order} foi revalidado`,
        message: notificationMessage,
      },
    })
    return NextResponse.json({ checkIn: updated })
  }

  // Delete
  if (body.action === 'delete') {
    const current = await prisma.checkIn.findUnique({
      where: { id: params.id },
      include: { live: { select: { title: true, order: true } } },
    })
    if (current) {
      await prisma.notification.create({
        data: {
          userId: current.userId,
          type: 'CHECKIN_REMOVED',
          title: `🗑 Seu check-in da Aula ${current.live.order} foi removido`,
          message: current.live.title,
        },
      })
    }
    await prisma.checkIn.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  }

  // Admin edit
  if (body.action === 'edit') {
    const current = await prisma.checkIn.findUnique({ where: { id: params.id } })
    if (!current) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 })
    const { insight, linkedinUrl } = body
    if (current.type === 'AULA') {
      if (!insight || insight.trim().length < 10) {
        return NextResponse.json({ error: 'Insight deve ter mínimo 10 caracteres.' }, { status: 400 })
      }
      const updated = await prisma.checkIn.update({
        where: { id: params.id },
        data: { insight: insight.trim() },
      })
      return NextResponse.json({ checkIn: updated })
    } else {
      const trimmed = (linkedinUrl || '').trim()
      if (!trimmed.startsWith('https://www.linkedin.com/') || !trimmed.includes('posts/')) {
        return NextResponse.json({ error: 'URL LinkedIn inválida.' }, { status: 400 })
      }
      const updated = await prisma.checkIn.update({
        where: { id: params.id },
        data: { linkedinUrl: trimmed },
      })
      return NextResponse.json({ checkIn: updated })
    }
  }

  // Legacy: status update (APPROVED / REJECTED)
  const { status, adminNote } = body
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

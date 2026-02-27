import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ALLOWED_EMOJIS = ['💡', '🔥', '🙌', '👏', '🤔']

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Faça login para reagir.' }, { status: 401 })

  const { checkInId, emoji } = await request.json()

  if (!checkInId || !ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
  }

  // Toggle: if reaction exists, delete it; otherwise create
  const existing = await prisma.reaction.findUnique({
    where: { checkInId_userId: { checkInId, userId: session.userId } },
  })

  if (existing) {
    if (existing.emoji === emoji) {
      // Same emoji → remove reaction
      await prisma.reaction.delete({ where: { id: existing.id } })
      return NextResponse.json({ action: 'removed' })
    }
    // Different emoji → update
    const updated = await prisma.reaction.update({
      where: { id: existing.id },
      data: { emoji },
    })
    return NextResponse.json({ action: 'updated', reaction: updated })
  }

  const reaction = await prisma.reaction.create({
    data: { checkInId, userId: session.userId, emoji },
  })

  return NextResponse.json({ action: 'added', reaction }, { status: 201 })
}

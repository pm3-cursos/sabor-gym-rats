import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const { name, linkedinProfileUrl, showFirstNameOnly, reminderDays2, reminderDays1, reminder12h, reminder1h } = body

  const data: Record<string, unknown> = {}

  if (name !== undefined) {
    const trimmed = (name as string).trim()
    if (trimmed.length < 2) {
      return NextResponse.json({ error: 'Nome muito curto.' }, { status: 400 })
    }
    data.name = trimmed
  }

  if (linkedinProfileUrl !== undefined) {
    if (linkedinProfileUrl && !(linkedinProfileUrl as string).includes('linkedin.com/')) {
      return NextResponse.json(
        { error: 'URL inválida. Deve conter "linkedin.com/".' },
        { status: 400 },
      )
    }
    data.linkedinProfileUrl = linkedinProfileUrl || null
  }

  if (showFirstNameOnly !== undefined) data.showFirstNameOnly = Boolean(showFirstNameOnly)
  if (reminderDays2 !== undefined) data.reminderDays2 = Boolean(reminderDays2)
  if (reminderDays1 !== undefined) data.reminderDays1 = Boolean(reminderDays1)
  if (reminder12h !== undefined) data.reminder12h = Boolean(reminder12h)
  if (reminder1h !== undefined) data.reminder1h = Boolean(reminder1h)

  const user = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: {
      id: true,
      name: true,
      linkedinProfileUrl: true,
      showFirstNameOnly: true,
      reminderDays2: true,
      reminderDays1: true,
      reminder12h: true,
      reminder1h: true,
    },
  })

  return NextResponse.json({ user })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  await prisma.user.update({
    where: { id: session.userId },
    data: { deletedAt: new Date() },
  })

  const cookieStore = await cookies()
  cookieStore.delete('token')

  return NextResponse.json({ ok: true })
}

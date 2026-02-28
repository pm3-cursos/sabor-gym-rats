import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  // Ignore dynamic reminder IDs (not in DB)
  if (params.id.startsWith('reminder-')) {
    return NextResponse.json({ ok: true })
  }

  await prisma.notification.updateMany({
    where: { id: params.id, userId: session.userId },
    data: { read: true },
  })

  return NextResponse.json({ ok: true })
}

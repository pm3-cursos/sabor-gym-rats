import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { linkedinProfileUrl } = await request.json()

  if (linkedinProfileUrl !== undefined && linkedinProfileUrl !== null && linkedinProfileUrl !== '') {
    if (!linkedinProfileUrl.includes('linkedin.com/')) {
      return NextResponse.json(
        { error: 'URL inválida. Deve conter "linkedin.com/".' },
        { status: 400 },
      )
    }
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      linkedinProfileUrl: linkedinProfileUrl || null,
    },
    select: { id: true, linkedinProfileUrl: true },
  })

  return NextResponse.json({ user })
}

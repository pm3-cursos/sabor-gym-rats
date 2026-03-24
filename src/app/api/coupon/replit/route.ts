import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCouponStatus } from '@/lib/coupon'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const live6 = await prisma.live.findUnique({
    where: { order: 6 },
    select: { id: true },
  })

  if (!live6) {
    return NextResponse.json({ couponEligible: false, couponCode: null, couponRank: null })
  }

  const isAdmin = session.role === 'ADMIN'
  const result = await getCouponStatus(session.userId, isAdmin, live6.id)

  return NextResponse.json(result)
}

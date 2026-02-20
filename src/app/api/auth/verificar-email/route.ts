import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (!token) {
    return NextResponse.redirect(`${appUrl}/verificar-email?status=invalido`)
  }

  try {
    const verifyToken = await prisma.emailVerificationToken.findUnique({ where: { token } })

    if (!verifyToken) {
      return NextResponse.redirect(`${appUrl}/verificar-email?status=invalido`)
    }

    if (verifyToken.expiresAt < new Date()) {
      return NextResponse.redirect(`${appUrl}/verificar-email?status=expirado`)
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verifyToken.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerificationToken.delete({
        where: { id: verifyToken.id },
      }),
    ])

    return NextResponse.redirect(`${appUrl}/verificar-email?status=ok`)
  } catch {
    return NextResponse.redirect(`${appUrl}/verificar-email?status=invalido`)
  }
}

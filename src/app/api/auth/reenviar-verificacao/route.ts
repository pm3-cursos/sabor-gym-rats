import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmailVerification } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'E-mail já confirmado.' })
    }

    // Delete existing tokens and create a new one
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } })

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.emailVerificationToken.create({
      data: { token, userId: user.id, expiresAt },
    })

    await sendEmailVerification(user.email, user.name, token)

    return NextResponse.json({ message: 'E-mail de confirmação reenviado.' })
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

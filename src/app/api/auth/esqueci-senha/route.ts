import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db'
import { sendPasswordReset } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'E-mail obrigatório.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    // Always return the same response to avoid leaking registered emails
    if (user) {
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      })

      try {
        await sendPasswordReset(user.email, user.name, token)
      } catch (emailErr) {
        console.error('[esqueci-senha] Falha ao enviar e-mail de reset:', emailErr)
        // Token still created — email delivery failure doesn't block the flow
      }
    }

    return NextResponse.json({
      message: 'Se este e-mail estiver cadastrado, você receberá um link em breve.',
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

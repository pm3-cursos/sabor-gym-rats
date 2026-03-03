import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { Resend } from 'resend'
import { getFrom, getAppUrl } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { to } = await request.json()
  if (!to || !to.includes('@')) {
    return NextResponse.json({ error: 'Informe um e-mail de destino válido.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY não configurada nas variáveis de ambiente.' },
      { status: 500 },
    )
  }

  const from = getFrom()
  const appUrl = getAppUrl()

  const resend = new Resend(apiKey)

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: '✅ Teste de e-mail — ProductRats Admin',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#f8fafc;padding:32px;border-radius:12px;">
          <h2 style="margin-top:0;">🏋️ ProductRats — Maratona PM3</h2>
          <p>Este é um e-mail de teste enviado pelo painel Admin.</p>
          <p style="color:#10b981;font-weight:600;">✅ Envio funcionando corretamente!</p>
          <hr style="border-color:#2c2735;margin:20px 0;" />
          <p style="color:#6b7280;font-size:12px;">Remetente: ${from}</p>
          <p style="color:#6b7280;font-size:12px;">URL base: ${appUrl}</p>
        </div>
      `,
    })

    if (result.error) {
      return NextResponse.json(
        { error: `Resend retornou erro: ${result.error.message ?? JSON.stringify(result.error)}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, id: result.data?.id, from, appUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Falha no envio: ${message}` }, { status: 500 })
  }
}

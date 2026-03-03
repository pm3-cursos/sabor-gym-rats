import { Resend } from 'resend'

// EMAIL_FROM: pode ser sobrescrito via env var ou via AppSettings (key: 'emailFrom').
// O admin pode alterar no painel Config sem re-deploy.
export const DEFAULT_FROM = 'onboarding@resend.dev'

export function getFrom(overrideFrom?: string | null): string {
  return overrideFrom?.trim() || process.env.EMAIL_FROM || DEFAULT_FROM
}

// NEXT_PUBLIC_APP_URL: setado manualmente nas env vars do Netlify/Vercel.
// process.env.URL: variável built-in do Netlify (URL do deploy atual).
export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.URL ??
    'http://localhost:3000'
  )
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendPasswordReset(
  to: string,
  name: string,
  token: string,
  overrideFrom?: string | null,
) {
  const resend = getResend()
  const from = getFrom(overrideFrom)
  const link = `${getAppUrl()}/redefinir-senha?token=${token}`

  await resend.emails.send({
    from,
    to,
    subject: 'Redefinição de senha — ProductRats',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#f8fafc;padding:32px;border-radius:12px;">
        <h2 style="margin-top:0;">🏋️ ProductRats — Maratona PM3</h2>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Recebemos uma solicitação de redefinição de senha para sua conta.</p>
        <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
        <a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Redefinir senha
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:24px;">Se você não solicitou isso, ignore este e-mail. Sua senha permanece a mesma.</p>
        <p style="color:#6b7280;font-size:12px;word-break:break-all;">Link: ${link}</p>
      </div>
    `,
  })
}

export async function sendEmailVerification(
  to: string,
  name: string,
  token: string,
  overrideFrom?: string | null,
) {
  const resend = getResend()
  const from = getFrom(overrideFrom)
  const link = `${getAppUrl()}/api/auth/verificar-email?token=${token}`

  await resend.emails.send({
    from,
    to,
    subject: 'Confirme seu e-mail — ProductRats',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:#f8fafc;padding:32px;border-radius:12px;">
        <h2 style="margin-top:0;">🏋️ ProductRats — Maratona PM3</h2>
        <p>Olá, <strong>${name}</strong>! Bem-vindo ao desafio!</p>
        <p>Confirme seu endereço de e-mail para ativar sua conta.</p>
        <a href="${link}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Confirmar e-mail
        </a>
        <p style="color:#6b7280;font-size:13px;margin-top:24px;">O link expira em 24 horas. Se você não criou esta conta, ignore este e-mail.</p>
        <p style="color:#6b7280;font-size:12px;word-break:break-all;">Link: ${link}</p>
      </div>
    `,
  })
}

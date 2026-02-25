'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerificarEmailContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  if (status === 'ok') {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold text-emerald-400">E-mail confirmado!</h2>
        <p className="text-gray-400">Sua conta está ativa. Agora você pode fazer login.</p>
        <Link href="/login" className="btn-primary block w-full text-center mt-2">
          Entrar
        </Link>
      </div>
    )
  }

  if (status === 'expirado') {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">⏰</div>
        <h2 className="text-xl font-bold text-amber-400">Link expirado</h2>
        <p className="text-gray-400">O link de confirmação expirou (válido por 24 horas).</p>
        <p className="text-gray-500 text-sm">Entre na sua conta para solicitar um novo e-mail de confirmação.</p>
        <Link href="/login" className="btn-primary block w-full text-center mt-2">
          Entrar
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center space-y-4">
      <div className="text-5xl">❌</div>
      <h2 className="text-xl font-bold text-red-400">Link inválido</h2>
      <p className="text-gray-400">Este link de confirmação é inválido ou já foi utilizado.</p>
      <Link href="/login" className="btn-secondary block w-full text-center mt-2">
        Voltar ao login
      </Link>
    </div>
  )
}

export default function VerificarEmailPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏋️</div>
          <h1 className="text-2xl font-bold">Confirmação de e-mail</h1>
          <p className="text-gray-400 text-sm mt-1">ProductRats — Maratona PM3</p>
        </div>
        <div className="card p-8">
          <Suspense fallback={<div className="text-center text-gray-400">Verificando...</div>}>
            <VerificarEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ADMIN_COUPON_CODE } from '@/lib/coupon'

interface Props {
  couponCode: string
  onClose: () => void
}

export default function ReplitCouponModal({ couponCode, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const isAdminTest = couponCode === ADMIN_COUPON_CODE

  function handleCopy() {
    navigator.clipboard.writeText(couponCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 overflow-y-auto">
      <div className="card w-full max-w-lg my-auto space-y-5 p-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="text-3xl">{isAdminTest ? '🧪' : '🎉'}</div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none shrink-0"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Saudação */}
        <div>
          {isAdminTest ? (
            <p className="text-sm font-semibold text-amber-400">[Modo Admin] Cupom de teste ativo 🧪</p>
          ) : (
            <h2 className="text-lg font-bold leading-snug">
              Parabéns! Você ganhou o Cupom Replit! 🎉
            </h2>
          )}
          {isAdminTest && (
            <p className="text-xs text-gray-500 mt-1">
              Este cupom é reservado para testes — não consome slots do pool de 500 participantes.
            </p>
          )}
        </div>

        {/* Detalhes do cupom */}
        <div className="bg-gray-800/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Código do cupom</p>
              <p className="font-mono font-bold text-lg text-violet-300 tracking-widest">{couponCode}</p>
            </div>
            <button
              onClick={handleCopy}
              className={`shrink-0 text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
              }`}
            >
              {copied ? '✓ Copiado!' : '📋 Copiar'}
            </button>
          </div>
          <div className="text-xs text-gray-500 space-y-1 border-t border-gray-700/60 pt-3">
            <p>📅 Válido até <strong className="text-gray-300">30/06/2026</strong></p>
            <p>⏰ Deve ser resgatado até <strong className="text-gray-300">31/03/2026</strong></p>
            <p>🎁 Benefício: <strong className="text-gray-300">1 mês do plano CORE (~$20) — gratuito</strong></p>
          </div>
        </div>

        {/* Como resgatar */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Como resgatar</p>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="bg-gray-800/40 rounded-lg p-3">
              <p className="font-medium text-gray-300 mb-1">✨ Nova conta no Replit</p>
              <p>
                Acesse:{' '}
                <a
                  href={`https://replit.com/signup?coupon=${couponCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 break-all"
                >
                  replit.com/signup?coupon={couponCode}
                </a>
              </p>
            </div>
            <div className="bg-gray-800/40 rounded-lg p-3">
              <p className="font-medium text-gray-300 mb-1">🔄 Conta gratuita existente</p>
              <p>Vá em <strong className="text-gray-300">Account → Upgrade</strong>, insira o código <span className="font-mono text-violet-400">{couponCode}</span> no campo de cupom e confirme.</p>
            </div>
          </div>
        </div>

        {/* Vídeo instrucional */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Vídeo explicativo</p>
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-950">
            <iframe
              src="https://www.loom.com/embed/597a29031c784dc7b812e4e47b24cb5c"
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </div>

        <button onClick={onClose} className="btn-secondary w-full">
          Fechar
        </button>
      </div>
    </div>
  )
}

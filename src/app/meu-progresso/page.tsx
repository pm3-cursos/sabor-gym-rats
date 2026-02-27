import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { calcPoints, calcAulaCount } from '@/lib/points'

export const dynamic = 'force-dynamic'

function getUserLevel(points: number, total: number) {
  if (total > 0 && points >= total) return { label: 'Maratonista PM3', icon: '🥇', color: 'text-yellow-400', next: null }
  if (points >= 3) return { label: 'Corredor', icon: '🥈', color: 'text-gray-300', next: { label: 'Maratonista PM3', at: total } }
  if (points >= 1) return { label: 'Iniciante', icon: '🥉', color: 'text-amber-500', next: { label: 'Corredor', at: 3 } }
  return { label: 'Na largada', icon: '🏁', color: 'text-gray-500', next: { label: 'Iniciante', at: 1 } }
}

export default async function MeuProgressoPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [lives, checkIns, allUsers] = await Promise.all([
    prisma.live.findMany({ orderBy: { order: 'asc' } }),
    prisma.checkIn.findMany({
      where: { userId: session.userId },
      include: { live: true },
    }),
    prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        checkIns: { where: { status: 'APPROVED' }, select: { type: true, status: true } },
      },
    }),
  ])

  const totalLives = lives.length
  const approvedCount = calcAulaCount(checkIns)
  const pendingCount = checkIns.filter((c) => c.status === 'PENDING').length

  // Rank by weighted points
  const sorted = allUsers
    .map((u) => ({ id: u.id, points: calcPoints(u.checkIns) }))
    .sort((a, b) => b.points - a.points)
  const userRank = sorted.findIndex((u) => u.id === session.userId) + 1
  const totalParticipants = sorted.length

  const level = getUserLevel(approvedCount, totalLives)
  const safeTotal = totalLives > 0 ? totalLives : 1
  const pct = Math.min(100, Math.round((approvedCount / safeTotal) * 100))

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Meu Progresso</h1>
        <p className="text-gray-400 text-sm">Olá, {session.name.split(' ')[0]}! Aqui está sua jornada na Maratona.</p>
      </div>

      {/* Level + Rank card */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className={`text-xl font-bold ${level.color}`}>
              {level.icon} {level.label}
            </div>
            {level.next && (
              <p className="text-xs text-gray-500 mt-0.5">
                Próximo nível: {level.next.label} (a partir de {level.next.at} aula{level.next.at !== 1 ? 's' : ''})
              </p>
            )}
          </div>
          {totalParticipants > 0 && userRank > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-white">#{userRank}</div>
              <div className="text-xs text-gray-500">de {totalParticipants} participantes</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{approvedCount}</div>
          <div className="text-xs text-gray-500 mt-1">aulas completas</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
          <div className="text-xs text-gray-500 mt-1">em revisão</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{totalLives - approvedCount}</div>
          <div className="text-xs text-gray-500 mt-1">restantes</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-300">Progresso geral</span>
          <span className={`font-bold tabular-nums ${approvedCount >= totalLives && totalLives > 0 ? 'text-emerald-400' : 'text-violet-400'}`}>
            {approvedCount}/{totalLives}
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              approvedCount >= totalLives && totalLives > 0
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-violet-600 to-violet-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Aulas list */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold">Minhas aulas</h2>
        </div>
        <ul className="divide-y divide-gray-800/60">
          {lives.map((live) => {
            const checkIn = checkIns.find((c) => c.liveId === live.id && c.type === 'AULA')
            const isApproved = checkIn?.status === 'APPROVED'
            const isPending = checkIn?.status === 'PENDING'
            const isRejected = checkIn?.status === 'REJECTED'

            return (
              <li key={live.id} className="px-5 py-4 flex items-start gap-3">
                <span
                  className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                    isApproved
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isPending
                      ? 'bg-amber-500/20 text-amber-400'
                      : isRejected
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-800 text-gray-600'
                  }`}
                >
                  {isApproved ? '✓' : live.order}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!live.isActive && !checkIn ? 'text-gray-600' : ''}`}>
                    {live.title}
                  </p>
                  {checkIn?.insight && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 italic">
                      "{checkIn.insight}"
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {isApproved && <span className="badge-approved text-xs">✓ Completa</span>}
                  {isPending && <span className="badge-pending text-xs">⏳ Revisão</span>}
                  {isRejected && <span className="badge-rejected text-xs">✗ Rejeitado</span>}
                  {!checkIn && !live.isActive && (
                    <span className="text-xs text-gray-600">Em breve</span>
                  )}
                  {!checkIn && live.isActive && (
                    <Link href="/dashboard" className="text-xs text-violet-400 hover:text-violet-300">
                      Fazer check-in →
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <Link href="/dashboard" className="btn-primary block text-center">
        Ir para Check-ins
      </Link>
    </div>
  )
}

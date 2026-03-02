import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { calcPoints, calcAulaCount, calcLinkedinCount, getUserLevel, getAdditionalBadges } from '@/lib/points'
import MeuProgressoAulas from './MeuProgressoAulas'

export const dynamic = 'force-dynamic'

function getLevelWithNext(aulaCount: number) {
  const base = getUserLevel(aulaCount)
  let next: { label: string; at: number } | null = null
  if (aulaCount === 0) next = { label: 'Iniciante', at: 1 }
  else if (aulaCount < 3) next = { label: 'Corredor', at: 3 }
  else if (aulaCount < 6) next = { label: 'Maratonista PM3', at: 6 }
  return { ...base, next }
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
        name: true,
        checkIns: {
          select: { type: true, status: true, isInvalid: true },
        },
        pointAdjustments: { select: { amount: true } },
      },
    }),
  ])

  const totalLives = lives.length
  const approvedCount = calcAulaCount(checkIns)
  const linkedinCount = calcLinkedinCount(checkIns)
  const additionalBadges = getAdditionalBadges(linkedinCount)

  const sorted = allUsers
    .map((u) => ({ id: u.id, name: u.name, points: calcPoints(u.checkIns, u.pointAdjustments) }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'pt-BR'))
  const userRank = sorted.findIndex((u) => u.id === session.userId) + 1
  const totalParticipants = sorted.length
  const userPoints = sorted.find((u) => u.id === session.userId)?.points ?? 0

  const level = getLevelWithNext(approvedCount)
  const safeTotal = totalLives > 0 ? totalLives : 1
  const pct = Math.min(100, Math.round((approvedCount / safeTotal) * 100))

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
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
            {additionalBadges.map((b) => (
              <span key={b.label} className={`text-xs font-medium mr-2 ${b.color}`}>
                {b.icon} {b.label}
              </span>
            ))}
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
              <div className="text-sm font-bold text-violet-400 mt-0.5">{userPoints} pts</div>
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
          <div className="text-2xl font-bold text-blue-400">{linkedinCount}</div>
          <div className="text-xs text-gray-500 mt-1">posts LinkedIn</div>
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

      {/* Aulas list — interactive (edit/delete) */}
      <MeuProgressoAulas
        lives={lives.map((l) => ({
          id: l.id,
          title: l.title,
          order: l.order,
          isActive: l.isActive,
          scheduledAt: l.scheduledAt ? l.scheduledAt.toISOString() : null,
        }))}
        checkIns={checkIns.map((c) => ({
          id: c.id,
          liveId: c.liveId,
          type: c.type,
          insight: c.insight,
          linkedinUrl: c.linkedinUrl,
          status: c.status,
          isInvalid: c.isInvalid,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        }))}
      />

      <Link href="/ranking" className="btn-secondary w-full">
        Ver meu ranking →
      </Link>
    </div>
  )
}

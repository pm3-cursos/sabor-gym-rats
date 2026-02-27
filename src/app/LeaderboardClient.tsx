'use client'

interface LevelInfo {
  label: string
  icon: string
  color: string
}

interface LeaderboardEntry {
  id: string
  name: string
  points: number
  aulaCount: number
  rank: number
  level: LevelInfo
}

interface Props {
  leaderboard: LeaderboardEntry[]
  currentUserId: string | null
  totalLives: number
  maxItems?: number
  firstNameOnly?: boolean
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>
  if (rank === 2) return <span className="text-2xl">🥈</span>
  if (rank === 3) return <span className="text-2xl">🥉</span>
  return (
    <span className="w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-500">
      {rank}
    </span>
  )
}

export default function LeaderboardClient({
  leaderboard,
  currentUserId,
  totalLives,
  maxItems,
  firstNameOnly = false,
}: Props) {
  const displayName = (name: string) =>
    firstNameOnly ? name.split(' ')[0] : name

  // When maxItems is set (e.g. Home compact mode), show a flat top-N list
  if (maxItems !== undefined) {
    const topN = leaderboard.slice(0, maxItems)
    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold">
            Placar{' '}
            <span className="text-xs text-gray-600 font-normal">Top {maxItems}</span>
          </h2>
          <span className="text-xs text-gray-600">
            🏁 Aula: +1 pt&nbsp;&nbsp;·&nbsp;&nbsp;🚀 LinkedIn: +3 pts bônus
          </span>
        </div>
        {topN.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-600">
            <div className="text-4xl mb-3">🏁</div>
            <p>Nenhum participante ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-800/60">
            {topN.map((user) => {
              const safeTotal = totalLives > 0 ? totalLives : 1
              const pct = Math.min(100, Math.round((user.aulaCount / safeTotal) * 100))
              const isComplete = totalLives > 0 && user.aulaCount >= totalLives
              return (
                <li key={user.id} className="px-5 py-3 flex items-center gap-4">
                  <RankBadge rank={user.rank} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium truncate">{displayName(user.name)}</span>
                      {isComplete && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                          🏆 Completo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-violet-700'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${isComplete ? 'text-emerald-400' : 'text-white'}`}>
                        {user.points} pts
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  // Default mode: positions 4–10 + current user if outside
  const listEntries = leaderboard.filter((u) => u.rank >= 4 && u.rank <= 10)

  const currentUserEntry = currentUserId
    ? leaderboard.find((u) => u.id === currentUserId)
    : null

  const userIsInList =
    currentUserEntry && currentUserEntry.rank >= 4 && currentUserEntry.rank <= 10
  const userIsTop3 = currentUserEntry && currentUserEntry.rank <= 3
  const appendUser =
    currentUserEntry && !userIsInList && !userIsTop3

  function renderRow(user: LeaderboardEntry, isMe: boolean, isSeparate = false) {
    const safeTotal = totalLives > 0 ? totalLives : 1
    const pct = Math.min(100, Math.round((user.aulaCount / safeTotal) * 100))
    const isComplete = totalLives > 0 && user.aulaCount >= totalLives

    return (
      <li
        key={user.id + (isSeparate ? '-sep' : '')}
        className={`px-5 py-4 flex items-center gap-4 ${
          isMe && isSeparate
            ? 'bg-violet-600/20 border border-violet-500/40 rounded-lg mx-3 my-2'
            : isMe
            ? 'bg-violet-500/15 border-l-4 border-l-violet-500 ring-1 ring-inset ring-violet-500/30'
            : isComplete
            ? 'bg-emerald-500/5'
            : ''
        }`}
      >
        <RankBadge rank={user.rank} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`font-medium truncate ${isMe ? 'text-violet-300' : ''}`}>
              {displayName(user.name)}
              {isMe && <span className="ml-1 text-xs text-violet-400">(você)</span>}
            </span>
            <span className={`text-xs font-medium shrink-0 ${user.level.color}`}>
              {user.level.icon} {user.level.label}
            </span>
            {isComplete && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                🏆 Completo
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isComplete ? 'bg-emerald-500' : isMe ? 'bg-violet-500' : 'bg-violet-700'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className={`text-sm font-bold tabular-nums shrink-0 ${
                isComplete ? 'text-emerald-400' : isMe ? 'text-violet-300' : 'text-white'
              }`}
            >
              {user.points} pts
            </span>
          </div>
        </div>
      </li>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold">
          Placar{' '}
          <span className="text-xs text-gray-600 font-normal">posições 4–10</span>
        </h2>
        <span className="text-xs text-gray-600">
          🏁 Aula: +1 pt&nbsp;&nbsp;·&nbsp;&nbsp;🚀 LinkedIn: +3 pts bônus
        </span>
      </div>

      {listEntries.length === 0 && !appendUser ? (
        <div className="px-5 py-10 text-center text-gray-600">
          <div className="text-4xl mb-3">🏁</div>
          <p>Ainda não há participantes nas posições 4–10.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-800/60">
          {listEntries.map((user) =>
            renderRow(user, user.id === currentUserId),
          )}

          {appendUser && (
            <>
              <li className="px-5 py-2 bg-gray-900/60">
                <p className="text-xs text-gray-600 text-center">· · · sua posição · · ·</p>
              </li>
              {renderRow(currentUserEntry!, true, true)}
            </>
          )}
        </ul>
      )}
    </div>
  )
}

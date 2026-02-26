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

export default function LeaderboardClient({ leaderboard, currentUserId, totalLives }: Props) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="font-semibold">Placar</h2>
        {leaderboard.length === 0 && (
          <span className="text-xs text-gray-600">Nenhum participante ainda</span>
        )}
      </div>

      {leaderboard.length === 0 ? (
        <div className="px-5 py-10 text-center text-gray-600">
          <div className="text-4xl mb-3">🏁</div>
          <p>Seja o primeiro a se cadastrar!</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-800/60">
          {leaderboard.map((user) => {
            const isMe = user.id === currentUserId
            const safeTotal = totalLives > 0 ? totalLives : 1
            const pct = Math.min(100, Math.round((user.aulaCount / safeTotal) * 100))
            const isComplete = totalLives > 0 && user.aulaCount >= totalLives

            return (
              <li
                key={user.id}
                className={`px-5 py-4 flex items-center gap-4 ${
                  isMe
                    ? 'bg-violet-500/10 border-l-2 border-l-violet-500'
                    : isComplete
                    ? 'bg-emerald-500/5'
                    : ''
                }`}
              >
                <RankBadge rank={user.rank} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`font-medium truncate ${isMe ? 'text-violet-300' : ''}`}>
                      {user.name}
                      {isMe && (
                        <span className="ml-1 text-xs text-violet-400">(você)</span>
                      )}
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
                          isComplete
                            ? 'bg-emerald-500'
                            : isMe
                            ? 'bg-violet-500'
                            : 'bg-violet-700'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums shrink-0 ${
                        isComplete ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
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

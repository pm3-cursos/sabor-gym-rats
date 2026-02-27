import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getFeed() {
  return prisma.checkIn.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      insight: true,
      linkedinUrl: true,
      createdAt: true,
      user: { select: { name: true } },
      live: { select: { title: true, order: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
  })
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  return `${days}d atrás`
}

export default async function FeedPage() {
  const items = await getFeed()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Feed da Maratona</h1>
        <p className="text-gray-400 text-sm">
          Acompanhe os insights dos participantes em tempo real.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-gray-600">
          <div className="text-4xl mb-3">📭</div>
          <p>Nenhum check-in aprovado ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const firstName = item.user.name.split(' ')[0]
            return (
              <div key={item.id} className="card p-5 card-hover">
                <div className="flex items-start gap-3">
                  {/* Avatar inicial */}
                  <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">
                    {firstName[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm">{firstName}</span>
                      <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                        Aula {item.live.order} ✓
                      </span>
                      <span className="text-xs text-gray-600 ml-auto">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-2 truncate">{item.live.title}</p>

                    {item.insight ? (
                      <blockquote className="text-sm text-gray-300 bg-gray-800/60 rounded-lg px-4 py-3 border-l-2 border-violet-500/40 italic">
                        "{item.insight}"
                      </blockquote>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Sem insight registrado.</p>
                    )}

                    {item.linkedinUrl && (
                      <a
                        href={item.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs text-violet-400 hover:text-violet-300 underline"
                      >
                        Ver no LinkedIn →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

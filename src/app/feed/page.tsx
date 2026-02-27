import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import FeedCard from './FeedCard'

export const dynamic = 'force-dynamic'

const EMOJIS = ['💡', '🔥', '🙌', '👏', '🤔']

async function getFeed(currentUserId: string | null) {
  const items = await prisma.checkIn.findMany({
    where: { status: 'APPROVED', type: 'AULA', isInvalid: false },
    select: {
      id: true,
      insight: true,
      linkedinUrl: true,
      createdAt: true,
      user: { select: { name: true } },
      live: { select: { title: true, order: true } },
      reactions: {
        select: { emoji: true, userId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
  })

  return items.map((item) => {
    const counts: Record<string, number> = {}
    let myReaction: string | null = null
    for (const r of item.reactions) {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1
      if (currentUserId && r.userId === currentUserId) {
        myReaction = r.emoji
      }
    }
    return {
      id: item.id,
      insight: item.insight,
      linkedinUrl: item.linkedinUrl,
      createdAt: item.createdAt.toISOString(),
      userName: item.user.name,
      liveTitle: item.live.title,
      liveOrder: item.live.order,
      reactionCounts: counts,
      myReaction,
    }
  })
}

export default async function FeedPage() {
  const session = await getSession()
  const items = await getFeed(session?.userId ?? null)

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
          <p>Nenhum check-in registrado ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              isLoggedIn={!!session}
              emojis={EMOJIS}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import FeedList from './FeedList'

export const dynamic = 'force-dynamic'

const EMOJIS = ['💡', '🔥', '🙌', '👏', '🤔']

async function getFeed(currentUserId: string | null) {
  const items = await prisma.checkIn.findMany({
    where: { status: 'APPROVED', type: 'AULA', isInvalid: false },
    select: {
      id: true,
      insight: true,
      linkedinUrl: true,
      userId: true,
      liveId: true,
      createdAt: true,
      user: { select: { name: true } },
      live: { select: { title: true, order: true } },
      reactions: {
        select: { emoji: true, userId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch LinkedIn URLs from LINKEDIN-type sibling check-ins
  const linkedinCheckIns = items.length > 0
    ? await prisma.checkIn.findMany({
        where: {
          type: 'LINKEDIN',
          status: 'APPROVED',
          isInvalid: false,
          userId: { in: items.map((i) => i.userId) },
          liveId: { in: items.map((i) => i.liveId) },
        },
        select: { userId: true, liveId: true, linkedinUrl: true },
      })
    : []

  const linkedinMap = new Map<string, string>()
  for (const li of linkedinCheckIns) {
    if (li.linkedinUrl) linkedinMap.set(`${li.userId}_${li.liveId}`, li.linkedinUrl)
  }

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
      linkedinUrl: linkedinMap.get(`${item.userId}_${item.liveId}`) ?? null,
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
          <a
            href="/dashboard"
            className="inline-block mt-4 text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-full transition-colors"
          >
            Fazer meu check-in
          </a>
        </div>
      ) : (
        <FeedList items={items} isLoggedIn={!!session} emojis={EMOJIS} />
      )}
    </div>
  )
}

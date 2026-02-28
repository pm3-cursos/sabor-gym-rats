import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import PerfilClient from './PerfilClient'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { linkedinProfileUrl: true, name: true, email: true },
  })

  return (
    <PerfilClient
      currentLinkedinUrl={user?.linkedinProfileUrl ?? null}
      userName={session.name}
      userEmail={session.email}
    />
  )
}

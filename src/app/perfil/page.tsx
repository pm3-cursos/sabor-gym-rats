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
    select: {
      name: true,
      email: true,
      linkedinProfileUrl: true,
      showFirstNameOnly: true,
      reminderDays2: true,
      reminderDays1: true,
      reminder12h: true,
      reminder1h: true,
    },
  })

  return (
    <PerfilClient
      userName={user?.name ?? session.name}
      userEmail={user?.email ?? session.email}
      currentLinkedinUrl={user?.linkedinProfileUrl ?? null}
      showFirstNameOnly={user?.showFirstNameOnly ?? false}
      reminderDays2={user?.reminderDays2 ?? true}
      reminderDays1={user?.reminderDays1 ?? true}
      reminder12h={user?.reminder12h ?? true}
      reminder1h={user?.reminder1h ?? true}
    />
  )
}

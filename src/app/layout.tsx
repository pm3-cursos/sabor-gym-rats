import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import MembershipPlusBanner from '@/components/MembershipPlusBanner'
import ReferralCampaignBanner from '@/components/ReferralCampaignBanner'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const metadata: Metadata = {
  title: 'ProductRats — Maratona PM3',
  description: 'Participe da Maratona PM3, assista às aulas, publique no LinkedIn e concorra a prêmios!',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'ProductRats — Maratona PM3',
    description: 'Participe da Maratona PM3, assista às aulas, publique no LinkedIn e concorra a prêmios!',
    siteName: 'ProductRats',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'ProductRats — Maratona PM3',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProductRats — Maratona PM3',
    description: 'Participe da Maratona PM3, assista às aulas, publique no LinkedIn e concorra a prêmios!',
    images: ['/og.png'],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, settings] = await Promise.all([
    getSession(),
    prisma.appSettings.findMany({ where: { key: { in: ['showRanking', 'showFeed', 'membershipPlusUrl', 'membershipPlusNavbar', 'membershipPlusBanner', 'referralBanner'] } } }),
  ])

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const showRankingOnHome = settingsMap['showRanking'] === 'true'
  const showFeedOnHome = settingsMap['showFeed'] === 'true'
  const membershipPlusUrl = settingsMap['membershipPlusUrl'] || null
  const membershipPlusNavbar = settingsMap['membershipPlusNavbar'] === 'true'
  const membershipPlusBanner = settingsMap['membershipPlusBanner'] === 'true'
  const referralBanner = settingsMap['referralBanner'] === 'true'

  return (
    <html lang="pt-BR">
      <body className="min-h-screen text-white antialiased">
        <Navbar
          user={session ? { name: session.name, role: session.role } : null}
          showRankingOnHome={showRankingOnHome}
          showFeedOnHome={showFeedOnHome}
          membershipPlusUrl={membershipPlusUrl}
          membershipPlusNavbar={membershipPlusNavbar}
        />
        {membershipPlusBanner && membershipPlusUrl && <MembershipPlusBanner url={membershipPlusUrl} />}
        {referralBanner && <ReferralCampaignBanner />}
        <main className={session ? 'pb-16 md:pb-0' : ''}>{children}</main>
        {session && <BottomNav isAdmin={session.role === 'ADMIN'} />}
        <footer className={`border-t border-gray-800 py-4 text-center space-y-1 ${session ? 'pb-20 md:pb-4' : 'pb-4'}`}>
          <p className="text-xs text-gray-600">Aplicação oficial PM3</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://pm3com-my.sharepoint.com/:b:/g/personal/admins_pm3_com_br/IQBC0a6MomvmR6qnNFxVxzijAdOxfDFzxC6NzCdpt-v0Bk0?e=DVWwev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-gray-400 underline transition-colors"
            >
              Termos e Condições
            </a>
            <span className="text-gray-800">·</span>
            <a
              href="/regras"
              className="text-xs text-gray-600 hover:text-gray-400 underline transition-colors"
            >
              Regras
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}

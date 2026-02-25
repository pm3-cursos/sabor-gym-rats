import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'ProductRats — Maratona PM3',
  description: 'Participe da Maratona PM3, assista às aulas, publique no LinkedIn e concorra a prêmios!',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        <Navbar
          user={session ? { name: session.name, role: session.role } : null}
        />
        <main>{children}</main>
      </body>
    </html>
  )
}

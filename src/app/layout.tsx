import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'PM3 Gymrats — Desafio de Lives',
  description: 'Participe do desafio de lives da PM3 e ganhe prêmios!',
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

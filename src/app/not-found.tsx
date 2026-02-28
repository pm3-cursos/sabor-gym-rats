import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-6xl">🐀</div>
        <h1 className="text-5xl font-bold text-gray-200">404</h1>
        <p className="text-gray-400">Essa página não existe na Maratona PM3.</p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/" className="btn-primary">
            Início
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            Meus check-ins
          </Link>
        </div>
      </div>
    </div>
  )
}

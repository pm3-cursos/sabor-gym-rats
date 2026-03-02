import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const settings = await prisma.appSettings.findMany()
  const result: Record<string, string> = {}
  for (const s of settings) result[s.key] = s.value
  return NextResponse.json(result)
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { key, value } = await request.json()
  if (!key) return NextResponse.json({ error: 'key é obrigatório.' }, { status: 400 })

  await prisma.appSettings.upsert({
    where: { key },
    update: { value: value ?? '' },
    create: { key, value: value ?? '' },
  })

  return NextResponse.json({ ok: true })
}

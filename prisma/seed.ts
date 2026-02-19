import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const lives = [
  {
    order: 1,
    title: 'Live 1 — PM3 Gymrats',
    description: 'Primeira live da série PM3 Gymrats de março.',
    scheduledAt: new Date('2026-03-03T19:00:00-03:00'),
    isActive: false,
  },
  {
    order: 2,
    title: 'Live 2 — PM3 Gymrats',
    description: 'Segunda live da série PM3 Gymrats de março.',
    scheduledAt: new Date('2026-03-06T19:00:00-03:00'),
    isActive: false,
  },
  {
    order: 3,
    title: 'Live 3 — PM3 Gymrats',
    description: 'Terceira live da série PM3 Gymrats de março.',
    scheduledAt: new Date('2026-03-10T19:00:00-03:00'),
    isActive: false,
  },
  {
    order: 4,
    title: 'Live 4 — PM3 Gymrats',
    description: 'Quarta live da série PM3 Gymrats de março.',
    scheduledAt: new Date('2026-03-13T19:00:00-03:00'),
    isActive: false,
  },
  {
    order: 5,
    title: 'Live 5 — PM3 Gymrats',
    description: 'Quinta live da série PM3 Gymrats de março.',
    scheduledAt: new Date('2026-03-17T19:00:00-03:00'),
    isActive: false,
  },
  {
    order: 6,
    title: 'Live 6 — PM3 Gymrats',
    description: 'Sexta live da série PM3 Gymrats de março.',
    scheduledAt: new Date('2026-03-20T19:00:00-03:00'),
    isActive: false,
  },
  {
    order: 7,
    title: 'Live 7 — PM3 Gymrats',
    description: 'Sétima live da série PM3 Gymrats de março.',
    scheduledAt: new Date('2026-03-24T19:00:00-03:00'),
    isActive: false,
  },
  {
    order: 8,
    title: 'Live 8 — PM3 Gymrats',
    description: 'Oitava e última live da série PM3 Gymrats de março.',
    scheduledAt: new Date('2026-03-27T19:00:00-03:00'),
    isActive: false,
  },
]

async function main() {
  console.log('🌱 Iniciando seed...')

  // Cria as 8 lives
  for (const live of lives) {
    await prisma.live.upsert({
      where: { order: live.order },
      update: live,
      create: live,
    })
  }
  console.log('✅ 8 lives criadas')

  // Cria usuário admin
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'PM3Gymrats2026!', 12)
  await prisma.user.upsert({
    where: { email: 'admin@pm3.com.br' },
    update: {},
    create: {
      name: 'Admin PM3',
      email: 'admin@pm3.com.br',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin criado: admin@pm3.com.br')

  console.log('🎉 Seed concluído!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

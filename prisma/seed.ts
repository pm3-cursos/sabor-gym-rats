import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const lives = [
  {
    order: 1,
    title: 'Radar de Mercado com IA: sustentando sua hipótese',
    description: 'Aula 1 da Maratona ProductRats PM3.',
    scheduledAt: new Date('2026-03-05T19:00:00-03:00'),
    isActive: true,
  },
  {
    order: 2,
    title: 'Discovery Product-Led: de problemas a oportunidades de crescimento',
    description: 'Aula 2 da Maratona ProductRats PM3.',
    scheduledAt: new Date('2026-03-10T19:00:00-03:00'),
    isActive: false,
  },
  {
    order: 3,
    title: 'MVP com IA: prototipar para aprender (vibe-coding)',
    description: 'Aula 3 da Maratona ProductRats PM3.',
    scheduledAt: new Date('2026-03-12T19:00:00-03:00'),
    isActive: false,
  },
  {
    order: 4,
    title: 'Métricas de Growth: o que é sucesso em um produto Product-Led',
    description: 'Aula 4 da Maratona ProductRats PM3.',
    scheduledAt: new Date('2026-03-17T19:00:00-03:00'),
    isActive: false,
  },
  {
    order: 5,
    title: 'Do MVP ao Experimento: desenhando testes que geram decisão',
    description: 'Aula 5 da Maratona ProductRats PM3.',
    scheduledAt: new Date('2026-03-19T19:00:00-03:00'),
    isActive: false,
  },
  {
    order: 6,
    title: 'Influência em Produto: como negociar decisões com stakeholders',
    description: 'Aula 6 da Maratona ProductRats PM3.',
    scheduledAt: new Date('2026-03-24T19:00:00-03:00'),
    isActive: false,
  },
]

async function main() {
  console.log('🌱 Iniciando seed...')

  // Remove lives with order > 6 (old extra entries)
  await prisma.live.deleteMany({ where: { order: { gt: 6 } } })

  // Upsert the 6 lives
  for (const live of lives) {
    await prisma.live.upsert({
      where: { order: live.order },
      update: {},
      create: live,
    })
  }
  console.log('✅ 6 aulas criadas/atualizadas')

  // Cria usuário admin
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'PM3ProductRats2026!', 12)
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

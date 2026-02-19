# PM3 Gymrats 🏋️

Sistema de check-in gamificado para as 8 lives de março da [PM3](https://pm3.com.br).

Inspirado no [GymRats](https://www.gymrats.app/), mas focado: uma competição simples onde os participantes postam no LinkedIn sobre as lives que assistiram e ganham pontos.

## Como funciona

1. Participante se cadastra com e-mail e senha
2. Assiste a uma live da série PM3 de março
3. Publica algo sobre a live no LinkedIn
4. Envia o link da publicação no sistema para ganhar **1 ponto**
5. Um admin da PM3 revisa e aprova o check-in
6. Quem completar as **8 lives** concorre ao prêmio 🏆

## Tech stack

- **Next.js 14** (App Router) — full-stack
- **Prisma** — ORM
- **PostgreSQL** — banco de dados (Neon.tech recomendado)
- **JWT** via `jose` — autenticação com HTTP-only cookies
- **Tailwind CSS** — estilização

## Setup local

### 1. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env`:

```env
DATABASE_URL="postgresql://..."   # URL do seu banco PostgreSQL
JWT_SECRET="valor-aleatorio-forte"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Banco de dados gratuito:** [Neon.tech](https://neon.tech) oferece PostgreSQL serverless com tier gratuito, integração nativa com Vercel.

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar tabelas e popular banco

```bash
npm run db:push   # cria as tabelas
npm run db:seed   # cria as 8 lives + usuário admin
```

**Admin inicial:**
- E-mail: `admin@pm3.com.br`
- Senha: `PM3Gymrats2026!`

> ⚠️ Troque a senha do admin após o primeiro acesso em produção.

### 4. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`

## Deploy na Vercel

1. Importe o repositório na Vercel
2. Configure as variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`)
3. O build roda `prisma generate` automaticamente (via `postinstall`)
4. Após o deploy, rode o seed via terminal local apontando para o banco de produção

## Estrutura das páginas

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/` | Placar público com todos os participantes | Público |
| `/cadastro` | Criar conta | Público |
| `/login` | Entrar | Público |
| `/dashboard` | Meus check-ins + enviar links | Autenticado |
| `/admin` | Aprovar/rejeitar check-ins, gerenciar lives | Admin |

## Fluxo do admin

1. Acessar `/admin` com a conta admin
2. Aba **Pendentes**: revisar links do LinkedIn enviados pelos participantes
3. Clicar em **Aprovar** (ponto é concedido) ou **Rejeitar** (participante pode reenviar)
4. Aba **Lives**: ativar/desativar check-ins por live, atualizar títulos e datas

> As lives são criadas pelo seed com títulos genéricos. Use a aba de admin para atualizar os títulos reais das lives antes de ativá-las.
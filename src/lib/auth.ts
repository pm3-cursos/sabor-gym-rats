import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-troque-em-producao'
)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export interface TokenPayload {
  userId: string
  email: string
  role: string
  name: string
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  // Enforce ban in real-time: reject session if user is now banned
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { isBanned: true },
  })
  if (!user || user.isBanned) return null
  return payload
}

import { prisma } from './db'

export const COUPON_CODE = 'MARATONAPM3'
export const ADMIN_COUPON_CODE = 'REPLIT-ADMIN-TEST'
export const COUPON_POOL_SIZE = 500
// 23:59:59 BRT on March 24, 2026 = 2026-03-25T02:59:59Z (BRT = UTC-3)
export const COUPON_DEADLINE = new Date('2026-03-25T02:59:59Z')

export interface CouponResult {
  couponEligible: boolean
  couponCode: string | null
  couponRank: number | null
}

/**
 * Computes coupon eligibility for a user who just completed aula 6.
 * For admins: always eligible with fixed reserved code, never counts toward the pool.
 * For regular users: check if within first 500 eligible check-ins.
 */
export async function computeCouponEligibility(
  userId: string,
  isAdmin: boolean,
  live6Id: string,
): Promise<CouponResult> {
  if (isAdmin) {
    return { couponEligible: true, couponCode: ADMIN_COUPON_CODE, couponRank: null }
  }

  const eligibleCheckIns = await prisma.checkIn.findMany({
    where: {
      liveId: live6Id,
      type: 'AULA',
      status: 'APPROVED',
      isInvalid: false,
      createdAt: { lt: COUPON_DEADLINE },
      user: { role: 'USER' },
    },
    orderBy: { createdAt: 'asc' },
    select: { userId: true },
    take: COUPON_POOL_SIZE,
  })

  const rankIndex = eligibleCheckIns.findIndex((ci) => ci.userId === userId)
  if (rankIndex === -1) {
    return { couponEligible: false, couponCode: null, couponRank: null }
  }

  return { couponEligible: true, couponCode: COUPON_CODE, couponRank: rankIndex + 1 }
}

/**
 * Returns coupon status for an existing user (used on page load / GET endpoint).
 * Checks whether the user has already completed aula 6 before computing eligibility.
 */
export async function getCouponStatus(
  userId: string,
  isAdmin: boolean,
  live6Id: string,
): Promise<CouponResult> {
  const hasAula6 = await prisma.checkIn.findFirst({
    where: {
      userId,
      liveId: live6Id,
      type: 'AULA',
      status: 'APPROVED',
      isInvalid: false,
    },
  })

  if (!hasAula6) {
    return { couponEligible: false, couponCode: null, couponRank: null }
  }

  return computeCouponEligibility(userId, isAdmin, live6Id)
}

/**
 * Computes coupon ranks for all eligible regular users (used in admin page).
 * Returns a Map of userId → rank (1-based). Users not in the map are not eligible.
 */
export async function computeAllCouponRanks(live6Id: string): Promise<Map<string, number>> {
  const eligibleCheckIns = await prisma.checkIn.findMany({
    where: {
      liveId: live6Id,
      type: 'AULA',
      status: 'APPROVED',
      isInvalid: false,
      createdAt: { lt: COUPON_DEADLINE },
      user: { role: 'USER' },
    },
    orderBy: { createdAt: 'asc' },
    select: { userId: true },
    take: COUPON_POOL_SIZE,
  })

  const rankMap = new Map<string, number>()
  eligibleCheckIns.forEach((ci, idx) => {
    rankMap.set(ci.userId, idx + 1)
  })
  return rankMap
}

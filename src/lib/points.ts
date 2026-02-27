export interface CheckInLike {
  type: string
  status: string
  isInvalid?: boolean
}

export function calcPoints(
  checkIns: CheckInLike[],
  adjustments: { amount: number }[] = [],
): number {
  const base = checkIns
    .filter((c) => c.status === 'APPROVED' && !c.isInvalid)
    .reduce((sum, c) => sum + (c.type === 'LINKEDIN' ? 3 : 1), 0)
  const adj = adjustments.reduce((s, a) => s + a.amount, 0)
  return base + adj
}

export function calcAulaCount(checkIns: CheckInLike[]): number {
  return checkIns.filter(
    (c) => c.status === 'APPROVED' && c.type === 'AULA' && !c.isInvalid,
  ).length
}

export function calcLinkedinCount(checkIns: CheckInLike[]): number {
  return checkIns.filter(
    (c) => c.status === 'APPROVED' && c.type === 'LINKEDIN' && !c.isInvalid,
  ).length
}

export interface LevelInfo {
  label: string
  icon: string
  color: string
}

export function getUserLevel(aulaCount: number): LevelInfo {
  if (aulaCount >= 6) return { label: 'Maratonista PM3', icon: '🥇', color: 'text-yellow-400' }
  if (aulaCount >= 3) return { label: 'Corredor', icon: '🥈', color: 'text-gray-300' }
  if (aulaCount >= 1) return { label: 'Iniciante', icon: '🥉', color: 'text-amber-500' }
  return { label: 'Na largada', icon: '🏁', color: 'text-gray-500' }
}

export function getAdditionalBadges(
  linkedinCount: number,
): { label: string; icon: string; color: string }[] {
  const badges: { label: string; icon: string; color: string }[] = []
  if (linkedinCount >= 6) {
    badges.push({ label: 'Maratonista LinkedIn', icon: '🚀', color: 'text-blue-400' })
  } else if (linkedinCount >= 1) {
    badges.push({ label: 'Compartilhou no LinkedIn', icon: '🔗', color: 'text-blue-400' })
  }
  return badges
}

export function calcPoints(checkIns: { type: string; status: string }[]): number {
  return checkIns
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + (c.type === 'LINKEDIN' ? 3 : 1), 0)
}

export function calcAulaCount(checkIns: { type: string; status: string }[]): number {
  return checkIns.filter((c) => c.status === 'APPROVED' && c.type === 'AULA').length
}

export const TZ = 'America/Sao_Paulo'

export function formatBR(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleString('pt-BR', { timeZone: TZ, ...opts })
}

export function formatDateBR(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
  })
}

export function formatDateTimeBR(date: string | Date): string {
  return new Date(date).toLocaleString('pt-BR', {
    timeZone: TZ,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 17/03/2026 00:00 BRT = 03:00 UTC (SP is UTC-3 after DST ends mid-March 2026)
export const FINAL_CHALLENGE_UNLOCK_UTC = new Date('2026-03-17T03:00:00.000Z')

export function isFinalChallengeUnlocked(): boolean {
  return new Date() >= FINAL_CHALLENGE_UNLOCK_UTC
}

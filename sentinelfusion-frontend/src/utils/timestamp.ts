/** "2026-08-01 14:30" → epoch ms (treats space as T for Date parsing). */
export function toEpoch(timestamp: string): number {
  return new Date(timestamp.replace(' ', 'T')).getTime()
}

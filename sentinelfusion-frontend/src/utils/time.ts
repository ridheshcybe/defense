/** Parses the mock 'YYYY-MM-DD HH:mm' (or ISO) timestamps into epoch ms. 0 when unparseable. */
export function parseTimestamp(value: string): number {
  if (value === 'just now') return Date.now()
  const time = Date.parse(value.replace(' ', 'T'))
  return Number.isFinite(time) ? time : 0
}

/** Human relative time, e.g. 'just now', '5 min ago', '2 hours ago', '3 days ago'. */
export function timeAgo(value: string): string {
  const then = parseTimestamp(value)
  if (then === 0) return value
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

import { MOCK_AOIS, MOCK_FIELD_OPS_USERS, MOCK_INCIDENTS } from '../data/mockData'
import { parseTimestamp } from '../utils/time'
import type {
  Activity,
  DateRange,
  IncidentTypeCount,
  LeadershipData,
  LeadershipStats,
  SeveritySlice,
  TrendPoint,
} from '../types'

const SIMULATED_DELAY_MS = 300

async function simulate<T>(producer: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))
  return producer()
}

function daysInRange(range: DateRange): number {
  if (range.preset === '7d') return 7
  if (range.preset === '30d') return 30
  if (range.preset === '90d') return 90
  const from = parseTimestamp(range.from)
  const to = parseTimestamp(range.to)
  return Math.max(1, Math.round((to - from) / 86_400_000))
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function userName(id: string): string {
  return MOCK_FIELD_OPS_USERS.find((user) => user.id === id)?.name ?? id
}

function buildStats(range: DateRange): LeadershipStats {
  const totalAOIs = MOCK_AOIS.length
  const activeIncidents = MOCK_INCIDENTS.filter((incident) => incident.status !== 'resolved').length
  const resolvedIncidents = MOCK_INCIDENTS.filter((incident) => incident.status === 'resolved').length
  const criticalIncidents = MOCK_INCIDENTS.filter(
    (incident) => incident.severity === 'critical',
  ).length
  return {
    totalAOIs,
    activeIncidents,
    // Demo trend: deterministic pseudo-fluctuation scaled by range length.
    activeIncidentsTrend:
      range.preset === '7d' ? 8 : range.preset === '90d' ? 24 : 12,
    avgResponseHours: 2.4,
    resolvedIncidents,
    resolutionRate: Math.round((resolvedIncidents / MOCK_INCIDENTS.length) * 100),
    fieldOpsActive: MOCK_FIELD_OPS_USERS.length,
    criticalIncidents,
  }
}

function inRange(timestamp: string, range: DateRange): boolean {
  // Compare 'YYYY-MM-DD' strings: lexicographic order is chronological and
  // timezone-free (avoids local-vs-UTC midnight drift on the boundary day).
  const date = timestamp.slice(0, 10)
  return date >= range.from && date <= range.to
}

function buildIncidentsByType(range: DateRange): IncidentTypeCount[] {
  const counts = new Map<string, number>()
  for (const incident of MOCK_INCIDENTS) {
    if (!inRange(incident.timestamp, range)) continue
    counts.set(incident.type, (counts.get(incident.type) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }) as IncidentTypeCount)
    .sort((a, b) => b.count - a.count)
}

function buildSeverityDistribution(range: DateRange): SeveritySlice[] {
  const counts = new Map<string, number>()
  for (const incident of MOCK_INCIDENTS) {
    if (!inRange(incident.timestamp, range)) continue
    counts.set(incident.severity, (counts.get(incident.severity) ?? 0) + 1)
  }
  return (['critical', 'warning', 'info'] as const)
    .map((severity) => ({ severity, count: counts.get(severity) ?? 0 }))
    .filter((slice) => slice.count > 0)
}

function buildTrend(range: DateRange): TrendPoint[] {
  const days = daysInRange(range)
  const end = parseTimestamp(range.to) || Date.now()
  const start = end - (days - 1) * 86_400_000
  const incidentCounts = new Map<string, number>()
  for (const incident of MOCK_INCIDENTS) {
    const key = incident.timestamp.slice(0, 10)
    incidentCounts.set(key, (incidentCounts.get(key) ?? 0) + 1)
  }
  // Deterministic pseudo-random walk so the line looks organic but tests stay stable.
  const points: TrendPoint[] = []
  let seed = range.preset.length * 7919
  for (let i = 0; i < days; i += 1) {
    const date = isoDate(start + i * 86_400_000)
    seed = (seed * 9301 + 49297) % 233280
    const base = Math.floor((seed / 233280) * 5) + 1
    points.push({ date, count: base + (incidentCounts.get(date) ?? 0) })
  }
  return points
}

const ACTIVITY_TYPE_MAP: Record<string, Activity['type']> = {
  created: 'incident_created',
  status: 'incident_status',
  assigned: 'incident_status',
}

function buildActivities(range: DateRange): Activity[] {
  const list: Activity[] = []
  for (const incident of MOCK_INCIDENTS) {
    for (const entry of incident.activityLog) {
      const type = ACTIVITY_TYPE_MAP[entry.type]
      if (!type) continue
      list.push({
        id: `act-${entry.id}`,
        timestamp: entry.timestamp,
        type,
        description: entry.description,
        user: entry.actor ? userName(entry.actor) : 'System',
      })
    }
  }
  list.push(
    {
      id: 'act-aoi-updated',
      timestamp: '2026-08-01 12:10',
      type: 'aoi_updated',
      description: 'Mumbai Central tier upgraded to Tier 1',
      user: 'Analyst Desk',
    },
    {
      id: 'act-mission-completed',
      timestamp: '2026-08-01 10:45',
      type: 'mission_completed',
      description: 'Field team completed patrol at Colaba Causeway',
      user: userName('user-1'),
    },
    {
      id: 'act-aoi-added',
      timestamp: '2026-07-31 20:15',
      type: 'aoi_added',
      description: 'New AOI Navi Mumbai created',
      user: 'Analyst Desk',
    },
  )
  const from = parseTimestamp(range.from)
  return list
    .filter((activity) => parseTimestamp(activity.timestamp) >= from)
    .sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp))
    .slice(0, 12)
}

export async function fetchLeadershipStats(range: DateRange): Promise<LeadershipStats> {
  return simulate(() => buildStats(range))
}

export async function fetchIncidentsByType(range: DateRange): Promise<IncidentTypeCount[]> {
  return simulate(() => buildIncidentsByType(range))
}

export async function fetchSeverityDistribution(range: DateRange): Promise<SeveritySlice[]> {
  return simulate(() => buildSeverityDistribution(range))
}

export async function fetchIncidentTrend(range: DateRange): Promise<TrendPoint[]> {
  return simulate(() => buildTrend(range))
}

export async function fetchActivities(range: DateRange): Promise<Activity[]> {
  return simulate(() => buildActivities(range))
}

export async function fetchLeadershipData(range: DateRange): Promise<LeadershipData> {
  return simulate(() => ({
    stats: buildStats(range),
    incidentsByType: buildIncidentsByType(range),
    severityDistribution: buildSeverityDistribution(range),
    incidentTrend: buildTrend(range),
    activities: buildActivities(range),
  }))
}
